from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ortools.sat.python import cp_model
import random

MAX_SCHEDULES = 50

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SolveRequest(BaseModel):

    data: dict

@app.get("/")
def root():

    return {
        "status": "ok"
    }

def bundles_conflict(
    bundle_a,
    bundle_b
):

    if (
        bundle_a['term']
        !=
        bundle_b['term']
    ):

        return False

    for meeting_a in bundle_a['meetings']:

        for meeting_b in bundle_b['meetings']:

            if (
                meeting_a['day']
                !=
                meeting_b['day']
            ):

                continue

            overlap = (

                meeting_a['startMinutes']
                <
                meeting_b['endMinutes']

                and

                meeting_b['startMinutes']
                <
                meeting_a['endMinutes']
            )

            if overlap:

                return True

    return False

def bundle_contains_course_code(
    bundle,
    course_code
):

    for section in bundle['sections']:

        code = (
            section['subject']
            +
            section['courseNumber']
        )

        if code == course_code:

            return True

    return False


def bundle_contains_lecture_crn(
    bundle,
    lecture_crn
):

    for section in bundle['sections']:

        if (
            section['componentType']
            ==
            'lecture'

            and

            section['crn']
            ==
            lecture_crn
        ):

            return True

    return False

def bundle_respects_availability(
    bundle,
    availability
):

    for meeting in bundle['meetings']:

        day = meeting['day']

        day_rules = availability.get(
            day
        )

        if not day_rules:

            continue

        if not day_rules['enabled']:

            return False

        if (

            meeting['startMinutes']
            <
            day_rules['earliestStart']
        ):

            return False

        if (

            meeting['endMinutes']
            >
            day_rules['latestEnd']
        ):

            return False

    return True

def bundle_respects_delivery_mode(
    bundle,
    delivery_mode
):

    lecture_sections = [

        section

        for section in
        bundle['sections']

        if (
            section['componentType']
            ==
            'lecture'
        )
    ]

    if len(lecture_sections) == 0:

        return True

    for lecture in lecture_sections:

        method = (

            lecture.get(
                'instructionalMethod',
                ''
            )

            .upper()
        )

        if (
            delivery_mode
            ==
            'face-to-face'
        ):

            if method != 'F2F':

                return False

        elif (
            delivery_mode
            ==
            'online-only'
        ):

            if method == 'F2F':

                return False

    return True

def bundle_has_real_lecture_times(
    bundle
):

    lecture_sections = [

        section

        for section in
        bundle['sections']

        if (
            section['componentType']
            ==
            'lecture'
        )
    ]

    #
    # No lecture sections.
    # Allow bundle.
    #

    if len(lecture_sections) == 0:

        return True

    for lecture in lecture_sections:

        meetings = lecture.get(
            'meetings',
            []
        )

        #
        # Reject lecture sections
        # with no real meetings.
        #

        if (
            len(meetings)
            == 0
        ):

            return False

    return True

def create_model(
    all_course_bundles,
    request_groups,
    availability,
    delivery_mode,
    forced_anchor=None,
    forced_course_code=None
):

    model = cp_model.CpModel()

    bundle_vars = {}
    objective_terms = []

    #
    # Course priority cost
    # measured in equivalent
    # minutes at school.
    #

    #
    # Filter bundles by
    # hard constraints
    #

    filtered_course_bundles = []

    for course_bundles in all_course_bundles:

        filtered = []

        for bundle in course_bundles:

            if not bundle_respects_availability(
                bundle,
                availability
            ):

                continue

            if not bundle_respects_delivery_mode(
                bundle,
                delivery_mode
            ):

                continue

            if not bundle_has_real_lecture_times(
                bundle
            ):

                continue

            filtered.append(
                bundle
            )

        filtered_course_bundles.append(
            filtered
        )

    all_course_bundles = (
        filtered_course_bundles
    )

    #
    # Create variables
    #

    for group_index, course_bundles in enumerate(
        all_course_bundles
    ):

        for bundle in course_bundles:

            bundle_id = (
                bundle['bundleId']
            )

            var = model.NewBoolVar(
                f'bundle_{bundle_id}'
            )


            bundle_vars[
                bundle_id
            ] = {

                'var': var,

                'bundle': bundle,

                'group_index': group_index
            }

            #
            # Optimization:
            # minimize sadness
            # from lower-priority
            # course choices
            #

            bundle_priority = 1

            for course in request_groups[
                group_index
            ][
                'courses'
            ]:

                code = (
                    course['code']
                )

                if any(

                    section[
                        'subject'
                    ] +
                    section[
                        'courseNumber'
                    ]

                    == code

                    for section in
                    bundle['sections']
                ):

                    bundle_priority = max(

                        bundle_priority,

                        course['priority']
                    )

            priority_cost = {

                5: 0,
                4: 30,
                3: 60,
                2: 90,
                1: 120

            }.get(
                bundle_priority,
                120
            )

            objective_terms.append(
                priority_cost * var
            )


    #
    # Pick-X constraints
    #

    for group_index, course_bundles in enumerate(
        all_course_bundles
    ):

        vars_for_group = []

        for bundle in course_bundles:

            bundle_id = (
                bundle['bundleId']
            )

            vars_for_group.append(

                bundle_vars[
                    bundle_id
                ]['var']
            )

        required_pick = (

            request_groups[
                group_index
            ][
                'pick'
            ]
        )

        #EKAB
        print(
            "Group",
            group_index,
            "pick",
            required_pick,
            "bundles",
            len(vars_for_group)
        )

        model.Add(
            sum(vars_for_group)
            ==
            required_pick
        )

    #
    # Conflict constraints
    #

    all_bundle_ids = list(
        bundle_vars.keys()
    )

    for i in range(
        len(all_bundle_ids)
    ):

        for j in range(
            i + 1,
            len(all_bundle_ids)
        ):

            bundle_a_id = (
                all_bundle_ids[i]
            )

            bundle_b_id = (
                all_bundle_ids[j]
            )

            info_a = (
                bundle_vars[
                    bundle_a_id
                ]
            )

            info_b = (
                bundle_vars[
                    bundle_b_id
                ]
            )

            if bundles_conflict(

                info_a['bundle'],
                info_b['bundle']
            ):

                model.Add(

                    info_a['var']
                    +
                    info_b['var']

                    <= 1
                )

    #
    # Optimization:
    # total time spent
    # at school
    #

    DAYS = [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun'
    ]

    TERMS = [
        '202609',
        '202701'
    ]

    for term in TERMS:

        for day in DAYS:

            used_vars = []

            conditional_starts = []
            conditional_ends = []

            for info in bundle_vars.values():

                bundle = info['bundle']
                var = info['var']

                if (
                    bundle['term']
                    !=
                    term
                ):

                    continue

                meetings_for_day = [

                    meeting

                    for meeting in
                    bundle['meetings']

                    if (
                        meeting['day']
                        ==
                        day
                    )
                ]

                if len(meetings_for_day) == 0:

                    continue

                used_vars.append(var)

                for idx, meeting in enumerate(
                    meetings_for_day
                ):

                    start_var = model.NewIntVar(
                        0,
                        9999,
                        f'start_{term}_{day}_{bundle["bundleId"]}_{idx}'
                    )

                    end_var = model.NewIntVar(
                        0,
                        1440,
                        f'end_{term}_{day}_{bundle["bundleId"]}_{idx}'
                    )

                    #
                    # If bundle selected:
                    # use real meeting times
                    #

                    model.Add(
                        start_var
                        ==
                        meeting['startMinutes']
                    ).OnlyEnforceIf(var)

                    model.Add(
                        end_var
                        ==
                        meeting['endMinutes']
                    ).OnlyEnforceIf(var)

                    #
                    # If bundle NOT selected:
                    # neutralize for min/max
                    #

                    model.Add(
                        start_var == 9999
                    ).OnlyEnforceIf(
                        var.Not()
                    )

                    model.Add(
                        end_var == 0
                    ).OnlyEnforceIf(
                        var.Not()
                    )

                    conditional_starts.append(
                        start_var
                    )

                    conditional_ends.append(
                        end_var
                    )

            if len(used_vars) == 0:

                continue

            day_used = model.NewBoolVar(
                f'used_{term}_{day}'
            )

            earliest_start = model.NewIntVar(
                0,
                9999,
                f'earliest_{term}_{day}'
            )

            latest_end = model.NewIntVar(
                0,
                1440,
                f'latest_{term}_{day}'
            )

            day_span = model.NewIntVar(
                0,
                1440,
                f'span_{term}_{day}'
            )

            model.AddMaxEquality(
                day_used,
                used_vars
            )

            model.AddMinEquality(
                earliest_start,
                conditional_starts
            )

            model.AddMaxEquality(
                latest_end,
                conditional_ends
            )

            model.Add(
                day_span
                ==
                latest_end
                -
                earliest_start
            ).OnlyEnforceIf(
                day_used
            )

            model.Add(
                day_span == 0
            ).OnlyEnforceIf(
                day_used.Not()
            )

            #
            # Clean unused-day values
            #

            model.Add(
                earliest_start == 0
            ).OnlyEnforceIf(
                day_used.Not()
            )

            model.Add(
                latest_end == 0
            ).OnlyEnforceIf(
                day_used.Not()
            )

            #
            # Prevent weird span math
            # on used days
            #

            model.Add(
                earliest_start <= latest_end
            ).OnlyEnforceIf(
                day_used
            )

            #
            # Count each used day
            # as 2 hours
            #

            objective_terms.append(
                120 * day_used
            )

            #
            # Penalize total
            # span of the day
            #

            objective_terms.append(
                day_span
            )


    #
    # Optimization:
    # semester balancing
    #

    fall_count = model.NewIntVar(
        0,
        20,
        'fall_count'
    )

    spring_count = model.NewIntVar(
        0,
        20,
        'spring_count'
    )

    difference = model.NewIntVar(
        0,
        20,
        'difference'
    )

    fall_vars = []
    spring_vars = []

    for info in bundle_vars.values():

        bundle = info['bundle']

        if (
            bundle['term']
            ==
            '202609'
        ):

            fall_vars.append(
                info['var']
            )

        elif (
            bundle['term']
            ==
            '202701'
        ):

            spring_vars.append(
                info['var']
            )

    model.Add(
        fall_count ==
        sum(fall_vars)
    )

    model.Add(
        spring_count ==
        sum(spring_vars)
    )

    model.AddAbsEquality(
        difference,

        fall_count -
        spring_count
    )

    #
    # Hard constraint:
    # never allow semester
    # imbalance > 1
    #

    model.Add(
        difference <= 1
    )

    #
    # Small soft preference
    # toward perfect balance
    #

    objective_terms.append(
        2 * difference
    )


    #
    # Optional lecture anchor
    #

    if forced_anchor:

        anchor_group_index = (
            forced_anchor[
                'group_index'
            ]
        )

        anchor_lecture_crn = (
            forced_anchor[
                'lecture_crn'
            ]
        )

        for bundle_id, info in bundle_vars.items():

            if (
                info['group_index']
                !=
                anchor_group_index
            ):

                continue

            bundle = info['bundle']

            contains_anchor = (
                bundle_contains_lecture_crn(
                    bundle,
                    anchor_lecture_crn
                )
            )

            if not contains_anchor:

                model.Add(
                    info['var'] == 0
                )

    #
    # Optional course anchor
    #

    if forced_course_code:

        matching_vars = []

        for info in bundle_vars.values():

            if bundle_contains_course_code(
                info['bundle'],
                forced_course_code
            ):

                matching_vars.append(
                    info['var']
                )

        if len(matching_vars) > 0:

            model.Add(
                sum(matching_vars) >= 1
            )


    model.Minimize(
        sum(objective_terms)
    )

    return model, bundle_vars

def extract_solution(
    solver,
    bundle_vars
):

    selected_bundles = []

    for bundle_id, info in bundle_vars.items():

        if (
            solver.Value(
                info['var']
            )
            == 1
        ):

            selected_bundles.append(
                info['bundle']
            )

    return {

        'bundles':
            selected_bundles
    }

@app.post("/solve")
def solve(
    request: SolveRequest
):

    data = request.data

    frontend_request = (
        data['request']
    )

    all_course_bundles = (
        data['allCourseBundles']
    )

    availability = (

        frontend_request[
            'hardConstraints'
        ][
            'dayAvailability'
        ]
    )

    delivery_mode = (

        frontend_request[
            'hardConstraints'
        ][
            'deliveryMode'
        ]
    )

    request_groups = (
        frontend_request[
            'groups'
        ]
    )

    #
    # Early validation
    #

    for course_bundles in all_course_bundles:

        valid_bundles = []

        for bundle in course_bundles:

            if not bundle_respects_availability(
                bundle,
                availability
            ):

                continue

            if not bundle_respects_delivery_mode(
                bundle,
                delivery_mode
            ):

                continue

            if not bundle_has_real_lecture_times(
                bundle
            ):

                continue

            valid_bundles.append(
                bundle
            )

        if len(valid_bundles) == 0:

            return {

                'success': False,

                'error':
                    'No valid bundles remain after filtering.'
            }

    schedules = []

    used_signatures = set()



    anchor_candidates = []

    for group_index, course_bundles in enumerate(
        all_course_bundles
    ):

        lecture_crns = []

        for bundle in course_bundles:

            for section in bundle['sections']:

                if (
                    section['componentType']
                    ==
                    'lecture'
                ):

                    crn = (
                        section['crn']
                    )

                    if (
                        crn
                        not in
                        lecture_crns
                    ):

                        lecture_crns.append(
                            crn
                        )

        course_count = len(
            request_groups
        )

        if course_count <= 4:

            max_anchors = 2

        elif course_count <= 6:

            max_anchors = 3

        else:

            max_anchors = 5

        for crn in lecture_crns[:max_anchors]:

            anchor_candidates.append({

                'group_index':
                    group_index,

                'lecture_crn':
                    crn
            })





    if (
        len(anchor_candidates)
        == 0
    ):

        anchor_candidates = [None]

    #
    # Phase 1:
    # lecture-anchor solves
    #

    for anchor_candidate in anchor_candidates:

        model, bundle_vars = create_model(

            all_course_bundles,

            request_groups,

            availability,

            delivery_mode,

            anchor_candidate
        )

        solver = cp_model.CpSolver()

        solver.parameters.random_seed = random.randint(
            1,
            1_000_000
        )

        solver.parameters.max_time_in_seconds = 5

        status = solver.Solve(
            model
        )

        if status not in [

            cp_model.OPTIMAL,

            cp_model.FEASIBLE
        ]:

            continue

        schedule = extract_solution(
            solver,
            bundle_vars
        )

                

        signature = '-'.join(

            sorted(

                crn

                for bundle in
                schedule['bundles']

                for crn in
                bundle['crns']
            )
        )

        if (
            signature
            in
            used_signatures
        ):

            continue

        used_signatures.add(
            signature
        )

        
        schedules.append(
            schedule
        )

        if (
            len(schedules)
            >=
            MAX_SCHEDULES
        ):

            break

    
    #
    # Phase 2:
    # if diversity is low,
    # explore OR-course anchors
    #

    if (
        len(schedules)
        <
        MAX_SCHEDULES // 2
    ):

        or_course_codes = []

        for group in request_groups:

            #
            # Only interesting if there
            # is more than one possible
            # course choice.
            #

            if len(group['courses']) <= group['pick']:
                continue

            for course in group['courses']:

                code = course['code']

                if code not in or_course_codes:

                    or_course_codes.append(
                        code
                    )

            for course in group['courses']:

                code = course['code']

                if (
                    code
                    not in
                    or_course_codes
                ):

                    or_course_codes.append(
                        code
                    )

        for course_code in or_course_codes:

            model, bundle_vars = create_model(

                all_course_bundles,

                request_groups,

                availability,

                delivery_mode,

                forced_course_code=course_code
            )

            solver = cp_model.CpSolver()

            solver.parameters.random_seed = random.randint(
                1,
                1_000_000
            )

            solver.parameters.max_time_in_seconds = 5

            status = solver.Solve(
                model
            )

            if status not in [

                cp_model.OPTIMAL,

                cp_model.FEASIBLE
            ]:

                continue

            schedule = extract_solution(
                solver,
                bundle_vars
            )

            signature = '-'.join(

                sorted(

                    crn

                    for bundle in
                    schedule['bundles']

                    for crn in
                    bundle['crns']
                )
            )

            if (
                signature
                in
                used_signatures
            ):

                continue

            used_signatures.add(
                signature
            )

            schedules.append(
                schedule
            )

            if (
                len(schedules)
                >=
                MAX_SCHEDULES
            ):

                break



    def calculate_display_span(
        schedule
    ):

        day_map = {}

        for bundle in schedule['bundles']:

            for meeting in bundle['meetings']:

                key = (
                    bundle['term'],
                    meeting['day']
                )

                if key not in day_map:

                    day_map[key] = {

                        'start':
                            meeting['startMinutes'],

                        'end':
                            meeting['endMinutes']
                    }

                else:

                    day_map[key]['start'] = min(

                        day_map[key]['start'],

                        meeting['startMinutes']
                    )

                    day_map[key]['end'] = max(

                        day_map[key]['end'],

                        meeting['endMinutes']
                    )

        total_span = 0

        for info in day_map.values():

            total_span += (

                info['end']
                -
                info['start']
            )

        return total_span

    
    schedules.sort(

        key=lambda s:
            calculate_display_span(s)
    )

    return {

        'success': True,

        'schedules': schedules
    }








