# test.py

from main import create_model
from ortools.sat.python import cp_model


def make_bundle(
    bundle_id,
    term,
    subject,
    course_number,
    crn,
    meetings
):
    return {
        "bundleId": str(bundle_id),
        "term": term,
        "crns": [str(crn)],
        "meetings": meetings,
        "sections": [
            {
                "componentType": "lecture",
                "crn": str(crn),
                "subject": subject,
                "courseNumber": course_number,
                "meetings": [1],
                "instructionalMethod": "F2F"
            }
        ]
    }


def run_test(
    name,
    all_course_bundles,
    request_groups,
    expected_feasible
):

    model, bundle_vars = create_model(
        all_course_bundles,
        request_groups,
        {},
        "any",
        forced_anchor=None
    )

    solver = cp_model.CpSolver()

    status = solver.Solve(model)

    feasible = status in [
        cp_model.OPTIMAL,
        cp_model.FEASIBLE
    ]

    passed = (
        feasible == expected_feasible
    )

    if passed:
        print(f"PASS - {name}")
    else:
        print(f"FAIL - {name}")

        print(
            f"  Expected feasible={expected_feasible}"
        )

        print(
            f"  Actual feasible={feasible}"
        )

    return passed


#
# Shared bundles
#

stat_fall_1 = make_bundle(
    "13356",
    "202609",
    "STAT",
    "255",
    "13356",
    [
        {
            "day": "Mon",
            "startMinutes": 870,
            "endMinutes": 920
        }
    ]
)

stat_fall_2 = make_bundle(
    "13357",
    "202609",
    "STAT",
    "255",
    "13357",
    [
        {
            "day": "Tue",
            "startMinutes": 750,
            "endMinutes": 800
        }
    ]
)

stat_spring = make_bundle(
    "23292",
    "202701",
    "STAT",
    "255",
    "23292",
    [
        {
            "day": "Wed",
            "startMinutes": 750,
            "endMinutes": 800
        }
    ]
)

math_ok = make_bundle(
    "20001",
    "202609",
    "MATH",
    "122",
    "20001",
    [
        {
            "day": "Thu",
            "startMinutes": 600,
            "endMinutes": 650
        }
    ]
)

#
# Same time as STAT 13356
#

math_conflict = make_bundle(
    "20002",
    "202609",
    "MATH",
    "122",
    "20002",
    [
        {
            "day": "Mon",
            "startMinutes": 870,
            "endMinutes": 920
        }
    ]
)

passed = 0
failed = 0

#
# Test 1
#

if run_test(
    "Single STAT255",
    [
        [
            stat_fall_1,
            stat_fall_2,
            stat_spring
        ]
    ],
    [
        {
            "pick": 1,
            "courses": [
                {
                    "code": "STAT255",
                    "priority": 5
                }
            ]
        }
    ],
    True
):
    passed += 1
else:
    failed += 1


#
# Test 3
#

if run_test(
    "Conflicting Courses",
    [
        [stat_fall_1],
        [math_conflict]
    ],
    [
        {
            "pick": 1,
            "courses": [
                {
                    "code": "STAT255",
                    "priority": 5
                }
            ]
        },
        {
            "pick": 1,
            "courses": [
                {
                    "code": "MATH122",
                    "priority": 5
                }
            ]
        }
    ],
    False
):
    passed += 1
else:
    failed += 1

#
# Test 4
#

if run_test(
    "Pick 2 of 3",
    [
        [
            stat_fall_1,
            stat_fall_2,
            stat_spring
        ]
    ],
    [
        {
            "pick": 2,
            "courses": [
                {
                    "code": "STAT255",
                    "priority": 5
                }
            ]
        }
    ],
    True
):
    passed += 1
else:
    failed += 1

#
# Test 5
#

if run_test(
    "Impossible Pick 2 of 1",
    [
        [
            stat_fall_1
        ]
    ],
    [
        {
            "pick": 2,
            "courses": [
                {
                    "code": "STAT255",
                    "priority": 5
                }
            ]
        }
    ],
    False
):
    passed += 1
else:
    failed += 1

print()
print("===================================")
print(f"Passed: {passed}")
print(f"Failed: {failed}")
print("===================================")


