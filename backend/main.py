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

def create_model(
    all_course_bundles,
    forced_anchor=None
):

    model = cp_model.CpModel()

    bundle_vars = {}

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
    # Exactly one bundle per group
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

        model.Add(
            sum(vars_for_group) == 1
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

            #
            # Skip same group
            #

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

            #
            # ONLY constrain
            # target group
            #

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

@app.post("/solve")
def solve(
    request: SolveRequest
):

    data = request.data

    all_course_bundles = (
        data['allCourseBundles']
    )

    schedules = []

    used_signatures = set()

    #
    # Build anchor candidates
    #

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

        #
        # Limit to 5 lecture anchors
        # per group
        #

        for crn in lecture_crns[:5]:

            anchor_candidates.append({

                'group_index':
                    group_index,

                'lecture_crn':
                    crn
            })

    #
    # No lecture anchors?
    #

    if (
        len(anchor_candidates)
        == 0
    ):

        anchor_candidates = [None]

    #
    # Solve each lecture anchor
    #

    for anchor_candidate in anchor_candidates:

        model, bundle_vars = create_model(

            all_course_bundles,

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

    return {

        'success': True,

        'schedules': schedules
    }

