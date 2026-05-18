from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ortools.sat.python import cp_model

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
    forced_anchor=None
):

    model = cp_model.CpModel()

    bundle_vars = {}

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

            if (
                info_a['group_index']
                ==
                info_b['group_index']
            ):

                continue

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

#
# SCORING
#

def calculate_course_score(
    schedule,
    request_groups
):

    score = 0
    max_score = 0

    for group in request_groups:

        max_priority = max(
            course['priority']
            for course in group['courses']
        )

        max_score += (
            max_priority *
            group['pick']
        )

    for bundle in schedule['bundles']:

        matched_priority = 0

        for group in request_groups:

            for course in group['courses']:

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

                    matched_priority = max(

                        matched_priority,

                        course['priority']
                    )

        score += matched_priority

    if max_score == 0:
        return 0

    return score / max_score

def calculate_compact_score(
    schedule
):

    active_days = set()

    for bundle in schedule['bundles']:

        for meeting in bundle['meetings']:

            active_days.add(
                (
                    bundle['term'],
                    meeting['day']
                )
            )

    day_count = len(active_days)

    if day_count <= 2:
        return 1.0

    if day_count == 3:
        return 0.8

    if day_count == 4:
        return 0.45

    if day_count == 5:
        return 0.2

    return 0.0

def calculate_break_score(
    schedule
):

    meetings_by_day = {}

    for bundle in schedule['bundles']:

        for meeting in bundle['meetings']:

            key = (
                bundle['term'],
                meeting['day']
            )

            if key not in meetings_by_day:

                meetings_by_day[
                    key
                ] = []

            meetings_by_day[
                key
            ].append(
                meeting
            )

    total_gap_minutes = 0

    for meetings in meetings_by_day.values():

        meetings.sort(
            key=lambda m:
                m['startMinutes']
        )

        for i in range(
            len(meetings) - 1
        ):

            gap = (

                meetings[i + 1][
                    'startMinutes'
                ]

                -

                meetings[i][
                    'endMinutes'
                ]
            )

            if gap > 0:

                total_gap_minutes += gap

    max_reasonable_gap = 600

    normalized = min(
        total_gap_minutes /
        max_reasonable_gap,
        1.0
    )

    return 1.0 - normalized

def calculate_semester_balance_score(
    schedule
):

    fall_count = 0
    spring_count = 0

    for bundle in schedule['bundles']:

        if (
            bundle['term']
            ==
            '202609'
        ):

            fall_count += 1

        elif (
            bundle['term']
            ==
            '202701'
        ):

            spring_count += 1

    difference = abs(
        fall_count -
        spring_count
    )

    if difference <= 1:
        return 1.0

    if difference == 2:
        return 0.3

    return 0.0

def get_personality_weights(
    personality
):

    personalities = {

        'balanced': {

            'course': 0.35,
            'balance': 0.35,
            'compact': 0.20,
            'breaks': 0.10
        },

        'course-first': {

            'course': 0.55,
            'balance': 0.25,
            'compact': 0.10,
            'breaks': 0.10
        },

        'compact': {

            'course': 0.15,
            'balance': 0.35,
            'compact': 0.40,
            'breaks': 0.10
        },

        'relaxed': {

            'course': 0.15,
            'balance': 0.35,
            'compact': 0.10,
            'breaks': 0.40
        },

        'ultra-compact': {

            'course': 0.10,
            'balance': 0.30,
            'compact': 0.50,
            'breaks': 0.10
        },

        'low-stress': {

            'course': 0.15,
            'balance': 0.35,
            'compact': 0.05,
            'breaks': 0.45
        }
    }

    return personalities.get(

        personality,

        personalities['balanced']
    )

def score_schedule(
    schedule,
    request
):

    personality = (
        request[
            'softPreferences'
        ][
            'personality'
        ]
    )

    weights = (
        get_personality_weights(
            personality
        )
    )

    course_score = (
        calculate_course_score(
            schedule,
            request['groups']
        )
    )

    compact_score = (
        calculate_compact_score(
            schedule
        )
    )

    break_score = (
        calculate_break_score(
            schedule
        )
    )

    balance_score = (
        calculate_semester_balance_score(
            schedule
        )
    )

    total_score = (

        course_score
        *
        weights['course']

        +

        balance_score
        *
        weights['balance']

        +

        compact_score
        *
        weights['compact']

        +

        break_score
        *
        weights['breaks']
    )

    schedule['scores'] = {

        'total': round(
            total_score,
            3
        ),

        'course': round(
            course_score,
            3
        ),

        'balance': round(
            balance_score,
            3
        ),

        'compact': round(
            compact_score,
            3
        ),

        'breaks': round(
            break_score,
            3
        )
    }

    return total_score

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



        #
    # Compute best achievable
    # semester balance
    #

    total_requested_courses = sum(

        group['pick']

        for group in request_groups
    )

    forced_fall = 0
    forced_spring = 0

    for course_bundles in all_course_bundles:

        available_terms = set(

            bundle['term']

            for bundle in course_bundles
        )

        if (
            len(available_terms)
            == 1
        ):

            only_term = list(
                available_terms
            )[0]

            if only_term == '202609':

                forced_fall += 1

            elif only_term == '202701':

                forced_spring += 1

    remaining_courses = (

        total_requested_courses

        -

        forced_fall

        -

        forced_spring
    )

    best_possible_difference = None

    for extra_fall in range(
        remaining_courses + 1
    ):

        extra_spring = (

            remaining_courses
            -
            extra_fall
        )

        final_fall = (
            forced_fall +
            extra_fall
        )

        final_spring = (
            forced_spring +
            extra_spring
        )

        difference = abs(
            final_fall -
            final_spring
        )

        if (

            best_possible_difference
            is None

            or

            difference <
            best_possible_difference
        ):

            best_possible_difference = (
                difference
            )

    #
    # Hard-filter bundles that
    # would violate best balance
    #

    balanced_schedules_only = []

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

    for anchor_candidate in anchor_candidates:

        model, bundle_vars = create_model(

            all_course_bundles,

            request_groups,

            availability,

            delivery_mode,

            anchor_candidate
        )

        solver = cp_model.CpSolver()

        solver.parameters.max_time_in_seconds = 5

        status = solver.Solve(
            model
        )

        if (
            status
            !=
            cp_model.OPTIMAL
        ):

            continue

        schedule = extract_solution(
            solver,
            bundle_vars
        )

                #
        # Enforce best-achievable
        # semester balance
        #

        fall_count = 0
        spring_count = 0

        for bundle in schedule['bundles']:

            if (
                bundle['term']
                ==
                '202609'
            ):

                fall_count += 1

            elif (
                bundle['term']
                ==
                '202701'
            ):

                spring_count += 1

        difference = abs(
            fall_count -
            spring_count
        )


        total_courses = (
            fall_count +
            spring_count
        )

        perfectly_balanced = (
            total_courses % 2 == 0
        )

        if perfectly_balanced:

            if difference != 0:

                continue

        else:

            if difference > 1:

                continue



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

        score = score_schedule(

            schedule,

            frontend_request
        )

        schedule['score'] = round(
            score,
            3
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

    schedules.sort(

        key=lambda s:
            s['score'],

        reverse=True
    )

    return {

        'success': True,

        'schedules': schedules
    }

