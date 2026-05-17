function bundlesConflict(
    bundleA,
    bundleB
) {

    for (
        const meetingA of
        bundleA.meetings
    ) {

        for (
            const meetingB of
            bundleB.meetings
        ) {

            if (
                meetingA.day !==
                meetingB.day
            ) {

                continue;
            }

            /*
                Half-open intervals:
                [start, end)
            */

            const overlaps =

                meetingA.startMinutes <
                meetingB.endMinutes

                &&

                meetingB.startMinutes <
                meetingA.endMinutes;

            if (overlaps) {

                return true;
            }
        }
    }

    return false;
}

function buildConflictGraph(
    bundles
) {

    const conflicts =
        new Map();

    for (
        const bundle of
        bundles
    ) {

        conflicts.set(
            bundle.bundleId,
            new Set()
        );
    }

    for (
        let i = 0;
        i < bundles.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < bundles.length;
            j++
        ) {

            const bundleA =
                bundles[i];

            const bundleB =
                bundles[j];

            /*
                Same course cannot
                appear twice.
            */

            if (
                bundleA.course ===
                bundleB.course
            ) {

                conflicts
                    .get(
                        bundleA.bundleId
                    )
                    .add(
                        bundleB.bundleId
                    );

                conflicts
                    .get(
                        bundleB.bundleId
                    )
                    .add(
                        bundleA.bundleId
                    );

                continue;
            }

            /*
                Different semesters
                never conflict.
            */

            if (
                bundleA.term !==
                bundleB.term
            ) {

                continue;
            }

            if (

                bundlesConflict(
                    bundleA,
                    bundleB
                )
            ) {

                conflicts
                    .get(
                        bundleA.bundleId
                    )
                    .add(
                        bundleB.bundleId
                    );

                conflicts
                    .get(
                        bundleB.bundleId
                    )
                    .add(
                        bundleA.bundleId
                    );
            }
        }
    }

    return conflicts;
}

function getBundleUsedDays(
    bundle
) {

    return new Set(

        bundle.meetings.map(
            meeting =>
                meeting.day
        )
    );
}

function getBundleEarliestStart(
    bundle
) {

    let earliest =
        Infinity;

    for (
        const meeting of
        bundle.meetings
    ) {

        earliest =
            Math.min(
                earliest,
                meeting.startMinutes
            );
    }

    return earliest;
}

function getBundleLatestEnd(
    bundle
) {

    let latest = 0;

    for (
        const meeting of
        bundle.meetings
    ) {

        latest =
            Math.max(
                latest,
                meeting.endMinutes
            );
    }

    return latest;
}

function getBundleMeetingCount(
    bundle
) {

    return bundle.meetings.length;
}

function getBundleDailyMinutes(
    bundle
) {

    const totals = {

        Sun: 0,
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0
    };

    for (
        const meeting of
        bundle.meetings
    ) {

        totals[
            meeting.day
        ] += (

            meeting.endMinutes -
            meeting.startMinutes
        );
    }

    return totals;
}

function buildBundleMetadata(
    bundles
) {

    return bundles.map(
        bundle => ({

            bundleId:
                bundle.bundleId,

            course:
                bundle.course,

            term:
                bundle.term,

            usedDays:
                getBundleUsedDays(
                    bundle
                ),

            usedDayCount:
                getBundleUsedDays(
                    bundle
                ).size,

            earliestStart:
                getBundleEarliestStart(
                    bundle
                ),

            latestEnd:
                getBundleLatestEnd(
                    bundle
                ),

            meetingCount:
                getBundleMeetingCount(
                    bundle
                ),

            dailyMinutes:
                getBundleDailyMinutes(
                    bundle
                )
        })
    );
}

function buildIlpModelData(
    bundles
) {

    const conflicts =
        buildConflictGraph(
            bundles
        );

    const metadata =
        buildBundleMetadata(
            bundles
        );

    return {

        bundles,

        conflicts,

        metadata
    };
}

function bundleMatchesCourseRule(
    bundle,
    courseRule
) {

    if (
        bundle.course !==
        courseRule.code
    ) {

        return false;
    }

    if (
        courseRule.semester ===
        'Sept'
    ) {

        return (
            bundle.term ===
            '202609'
        );
    }

    if (
        courseRule.semester ===
        'Jan'
    ) {

        return (
            bundle.term ===
            '202701'
        );
    }

    return true;
}

function buildGroupModels(
    request,
    bundles
) {

    const groupModels = [];

    request.groups.forEach(

        (
            group,
            groupIndex
        ) => {

            const eligibleBundles =
                [];

            for (
                const bundle of
                bundles
            ) {

                for (
                    const courseRule of
                    group.courses
                ) {

                    if (

                        bundleMatchesCourseRule(
                            bundle,
                            courseRule
                        )
                    ) {

                        eligibleBundles.push({

                            bundle,

                            priority:
                                courseRule.priority
                        });

                        break;
                    }
                }
            }

            groupModels.push({

                groupId:
                    `group-${groupIndex}`,

                pick:
                    group.pick,

                eligibleBundles
            });
        }
    );

    return groupModels;
}

function countDistinctCourses(
    selectedBundles
) {

    return new Set(

        selectedBundles.map(
            bundle =>
                bundle.course
        )

    ).size;
}

function getDailyMinutes(
    bundles
) {

    const totals = {

        Sun: 0,
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0
    };

    for (
        const bundle of
        bundles
    ) {

        for (
            const meeting of
            bundle.meetings
        ) {

            totals[
                meeting.day
            ] += (

                meeting.endMinutes -
                meeting.startMinutes
            );
        }
    }

    return totals;
}

function buildScheduleDayMap(
    bundles
) {

    const map = {

        Sun: [],
        Mon: [],
        Tue: [],
        Wed: [],
        Thu: [],
        Fri: [],
        Sat: []
    };

    for (
        const bundle of
        bundles
    ) {

        for (
            const meeting of
            bundle.meetings
        ) {

            map[
                meeting.day
            ].push(
                meeting
            );
        }
    }

    for (
        const meetings of
        Object.values(
            map
        )
    ) {

        meetings.sort(
            (
                a,
                b
            ) =>

                a.startMinutes -
                b.startMinutes
        );
    }

    return map;
}

function getScheduleBreakMinutes(
    bundles
) {

    const dayMap =
        buildScheduleDayMap(
            bundles
        );

    let totalBreaks = 0;

    for (
        const meetings of
        Object.values(
            dayMap
        )
    ) {

        for (
            let i = 0;
            i < meetings.length - 1;
            i++
        ) {

            const current =
                meetings[i];

            const next =
                meetings[i + 1];

            totalBreaks +=

                next.startMinutes -
                current.endMinutes;
        }
    }

    return totalBreaks;
}

function getUsedDayCount(
    bundles
) {

    const daily =
        getDailyMinutes(
            bundles
        );

    return Object.values(
        daily
    )

    .filter(
        minutes =>
            minutes > 0
    )

    .length;
}

function scoreBalancedDays(
    bundles
) {

    const daily =
        getDailyMinutes(
            bundles
        );

    const values =
        Object.values(
            daily
        )

        .filter(
            minutes =>
                minutes > 0
        );

    if (
        values.length <= 1
    ) {

        return 100;
    }

    const avg =

        values.reduce(
            (
                a,
                b
            ) => a + b,
            0
        )

        / values.length;

    let variance = 0;

    for (
        const value of
        values
    ) {

        variance +=
            Math.pow(
                value - avg,
                2
            );
    }

    variance /=
        values.length;

    return Math.max(
        0,
        100 -
        (
            variance / 250
        )
    );
}

function scorePyramidSchedule(
    bundles
) {

    const daily =
        getDailyMinutes(
            bundles
        );

    const weights = {

        Mon: 1.5,
        Tue: 1.25,
        Wed: 1.0,
        Thu: 1.25,
        Fri: 1.5,

        Sun: 2.0,
        Sat: 2.0
    };

    let penalty = 0;

    for (
        const [
            day,
            minutes
        ]

        of Object.entries(
            daily
        )
    ) {

        penalty +=
            minutes *
            weights[day];
    }

    return Math.max(
        0,
        100 -
        (
            penalty / 120
        )
    );
}

function scoreBreakCompactness(
    bundles,
    preferMoreBreaks
) {

    const totalBreaks =
        getScheduleBreakMinutes(
            bundles
        );

    if (
        preferMoreBreaks
    ) {

        return Math.min(
            100,
            totalBreaks / 15
        );
    }

    return Math.max(
        0,
        100 -
        (
            totalBreaks / 15
        )
    );
}

function scoreCoursePriority(
    selectedBundleEntries
) {

    let total = 0;
    let maxPossible = 0;

    for (
        const entry of
        selectedBundleEntries
    ) {

        total +=
            entry.priority;

        maxPossible += 5;
    }

    if (
        maxPossible === 0
    ) {

        return 0;
    }

    return (
        total /
        maxPossible
    ) * 100;
}

function scoreEarlyVsLate(
    bundles,
    preferLater
) {

    let totalStart = 0;
    let count = 0;

    for (
        const bundle of
        bundles
    ) {

        for (
            const meeting of
            bundle.meetings
        ) {

            totalStart +=
                meeting.startMinutes;

            count++;
        }
    }

    if (count === 0) {

        return 0;
    }

    const avgStart =
        totalStart / count;

    const normalized =

        (
            avgStart - 480
        ) / 720;

    if (
        preferLater
    ) {

        return normalized * 100;
    }

    return (
        1 - normalized
    ) * 100;
}

function scoreDayPreference(
    bundles,
    preferMoreDays
) {

    const usedDays =
        getUsedDayCount(
            bundles
        );

    const normalized =
        (usedDays / 7) * 100;

    if (
        preferMoreDays
    ) {

        return normalized;
    }

    return 100 - normalized;
}

function buildObjectiveProfiles() {

    return [

        {
            name:
                'balanced',

            weights: {

                balancedDays: 1.2,

                pyramid: 0.2,

                compactness: 0.4,

                priority: 0.6,

                startTime: 0.3,

                usedDays: 0.8
            }
        },

        {
            name:
                'pyramid',

            weights: {

                balancedDays: 0.2,

                pyramid: 1.3,

                compactness: 0.4,

                priority: 0.6,

                startTime: 0.4,

                usedDays: 0.7
            }
        },

        {
            name:
                'compact',

            weights: {

                balancedDays: 0.3,

                pyramid: 0.3,

                compactness: 1.4,

                priority: 0.5,

                startTime: 0.3,

                usedDays: 0.8
            }
        },

        {
            name:
                'diverse',

            weights: {

                balancedDays: 0.6,

                pyramid: 0.6,

                compactness: 0.6,

                priority: 0.5,

                startTime: 0.5,

                usedDays: 0.6
            }
        },

        {
            name:
                'priority',

            weights: {

                balancedDays: 0.2,

                pyramid: 0.2,

                compactness: 0.2,

                priority: 1.8,

                startTime: 0.2,

                usedDays: 0.4
            }
        }
    ];
}

function evaluateSchedule(
    bundles,
    selectedBundleEntries,
    profile,
    preferences
) {

    const preferMoreBreaks =

        preferences
            .preferredBreaks ===
            'More';

    const preferLater =

        preferences
            .preferredStartTime ===
            'Later';

    const preferMoreDays =

        preferences
            .preferredDays ===
            'More';

    const balancedDays =
        scoreBalancedDays(
            bundles
        );

    const pyramid =
        scorePyramidSchedule(
            bundles
        );

    const compactness =
        scoreBreakCompactness(
            bundles,
            preferMoreBreaks
        );

    const priority =
        scoreCoursePriority(
            selectedBundleEntries
        );

    const startTime =
        scoreEarlyVsLate(
            bundles,
            preferLater
        );

    const usedDays =
        scoreDayPreference(
            bundles,
            preferMoreDays
        );

    const score =

        balancedDays *
        profile.weights.balancedDays

        +

        pyramid *
        profile.weights.pyramid

        +

        compactness *
        profile.weights.compactness

        +

        priority *
        profile.weights.priority

        +

        startTime *
        profile.weights.startTime

        +

        usedDays *
        profile.weights.usedDays;

    return {

        score,

        breakdown: {

            balancedDays,
            pyramid,
            compactness,
            priority,
            startTime,
            usedDays
        }
    };
}

async function solveWithILP(
    request,
    bundles
) {

    const glpkInstance =
        await glpk();

    const groupModels =
        buildGroupModels(
            request,
            bundles
        );

    const {
        conflicts
    } = buildIlpModelData(
        bundles
    );

    /*
        Build variable names
    */

    const vars =
        bundles.map(
            bundle =>

                `x_${bundle.bundleId}`
        );

    /*
        Objective:
        maximize total priority
    */

    const objectiveVars =
        [];

    for (
        const group of
        groupModels
    ) {

        for (
            const entry of
            group.eligibleBundles
        ) {

            objectiveVars.push({

                name:
                    `x_${entry.bundle.bundleId}`,

                coef:
                    entry.priority
            });
        }
    }

    const subjectTo = [];

    /*
        Conflict constraints
    */

    for (
        const bundle of
        bundles
    ) {

        const conflictsWith =
            conflicts.get(
                bundle.bundleId
            );

        for (
            const otherId of
            conflictsWith
        ) {

            /*
                Prevent duplicates
            */

            if (
                bundle.bundleId >
                otherId
            ) {

                continue;
            }

            subjectTo.push({

                name:

                    `conflict_${bundle.bundleId}_${otherId}`,

                vars: [

                    {
                        name:
                            `x_${bundle.bundleId}`,

                        coef: 1
                    },

                    {
                        name:
                            `x_${otherId}`,

                        coef: 1
                    }
                ],

                bnds: {

                    type:
                        glpkInstance.GLP_UP,

                    ub: 1,

                    lb: 0
                }
            });
        }
    }

    /*
        Group constraints
    */

    for (
        const group of
        groupModels
    ) {

        subjectTo.push({

            name:
                `group_${group.groupId}`,

            vars:

                group.eligibleBundles.map(
                    entry => ({

                        name:

                            `x_${entry.bundle.bundleId}`,

                        coef: 1
                    })
                ),

            bnds: {

                type:
                    glpkInstance.GLP_FX,

                ub:
                    group.pick,

                lb:
                    group.pick
            }
        });
    }

    const lp = {

        name:
            'uvic_schedule',

        objective: {

            direction:
                glpkInstance.GLP_MAX,

            name:
                'obj',

            vars:
                objectiveVars
        },

        subjectTo,

        binaries: vars
    };

    console.log(
        'ILP MODEL',
        lp
    );

    const result =
        glpkInstance.solve(
            lp
        );

    console.log(
        'ILP RESULT',
        result
    );

    if (
        !result.result.vars
    ) {

        return [];
    }

    const selectedBundles =
        [];

    for (
        const bundle of
        bundles
    ) {

        const varName =
            `x_${bundle.bundleId}`;

        if (

            result.result.vars[
                varName
            ] === 1
        ) {

            selectedBundles.push(
                bundle
            );
        }
    }

    return [

        {
            bundles:
                selectedBundles
        }
    ];
}

function getRequiredSinglePickGroups(
    request
) {

    return request.groups.filter(
        group =>

            group.pick === 1

            &&

            group.courses.length === 1
    );
}

function getLectureAnchors(
    bundles,
    request
) {

    const requiredGroups =
        getRequiredSinglePickGroups(
            request
        );

    const anchors = [];

    for (
        const group of
        requiredGroups
    ) {

        const courseCode =
            group.courses[0].code;

        /*
            Find lecture bundles
            for this course
        */

        const matchingBundles =
            bundles.filter(
                bundle =>

                    bundle.course ===
                    courseCode
            );

        /*
            Group by term
        */

        const byTerm = {

            '202609': [],
            '202701': []
        };

        for (
            const bundle of
            matchingBundles
        ) {

            byTerm[
                bundle.term
            ].push(
                bundle
            );
        }

        /*
            Choose up to 5
            while trying to
            preserve term diversity
        */

        const selected = [];

        /*
            First:
            try one per term
        */

        for (
            const term of
            [
                '202609',
                '202701'
            ]
        ) {

            if (
                byTerm[term].length > 0
            ) {

                selected.push(
                    byTerm[term][0]
                );
            }
        }

        /*
            Fill remaining slots
        */

        const remaining = [

            ...byTerm['202609']
                .slice(1),

            ...byTerm['202701']
                .slice(1)
        ];

        for (
            const bundle of
            remaining
        ) {

            if (
                selected.length >= 5
            ) {

                break;
            }

            selected.push(
                bundle
            );
        }

        /*
            Store anchors
        */

        for (
            const bundle of
            selected
        ) {

            anchors.push({

                course:
                    courseCode,

                bundle
            });
        }
    }

    return anchors;
}

async function solveSingleForcedSchedule(
    request,
    bundles,
    forcedBundleId
) {

    const glpkInstance =
        await window.loadGlpk();

    const groupModels =
        buildGroupModels(
            request,
            bundles
        );

    const {
        conflicts
    } = buildIlpModelData(
        bundles
    );

    const vars =
        bundles.map(
            bundle =>

                `x_${bundle.bundleId}`
        );

    const objectiveVars =
        [];

    for (
        const group of
        groupModels
    ) {

        for (
            const entry of
            group.eligibleBundles
        ) {

            objectiveVars.push({

                name:
                    `x_${entry.bundle.bundleId}`,

                coef:
                    entry.priority
            });
        }
    }

    const subjectTo = [];

    /*
        Conflict constraints
    */

    for (
        const bundle of
        bundles
    ) {

        const conflictsWith =
            conflicts.get(
                bundle.bundleId
            );

        for (
            const otherId of
            conflictsWith
        ) {

            if (
                bundle.bundleId >
                otherId
            ) {

                continue;
            }

            subjectTo.push({

                name:

                    `conflict_${bundle.bundleId}_${otherId}`,

                vars: [

                    {
                        name:
                            `x_${bundle.bundleId}`,

                        coef: 1
                    },

                    {
                        name:
                            `x_${otherId}`,

                        coef: 1
                    }
                ],

                bnds: {

                    type:
                        glpkInstance.GLP_UP,

                    ub: 1,

                    lb: 0
                }
            });
        }
    }

    /*
        Group constraints
    */

    for (
        const group of
        groupModels
    ) {

        subjectTo.push({

            name:
                `group_${group.groupId}`,

            vars:

                group.eligibleBundles.map(
                    entry => ({

                        name:

                            `x_${entry.bundle.bundleId}`,

                        coef: 1
                    })
                ),

            bnds: {

                type:
                    glpkInstance.GLP_FX,

                ub:
                    group.pick,

                lb:
                    group.pick
            }
        });
    }

    /*
        Forced anchor constraint
    */

    subjectTo.push({

        name:
            `forced_${forcedBundleId}`,

        vars: [

            {
                name:
                    `x_${forcedBundleId}`,

                coef: 1
            }
        ],

        bnds: {

            type:
                glpkInstance.GLP_FX,

            ub: 1,

            lb: 1
        }
    });

    const lp = {

        name:
            'uvic_schedule',

        objective: {

            direction:
                glpkInstance.GLP_MAX,

            name:
                'obj',

            vars:
                objectiveVars
        },

        subjectTo,

        binaries: vars
    };

    const result =
        glpkInstance.solve(
            lp
        );

    if (
        !result.result.vars
    ) {

        return null;
    }

    const selectedBundles =
        [];

    for (
        const bundle of
        bundles
    ) {

        const varName =
            `x_${bundle.bundleId}`;

        if (

            result.result.vars[
                varName
            ] === 1
        ) {

            selectedBundles.push(
                bundle
            );
        }
    }

    return {

        bundles:
            selectedBundles
    };
}

async function generateCandidateSchedules(
    request,
    bundles
) {

    const anchors =
        getLectureAnchors(
            bundles,
            request
        );

    console.log(
        'ANCHORS',
        anchors
    );

    const schedules = [];

    const seen =
        new Set();

    for (
        const anchor of
        anchors
    ) {

        console.log(
            'SOLVING ANCHOR',
            anchor
        );

        const result =
            await solveSingleForcedSchedule(

                request,

                bundles,

                anchor.bundle.bundleId
            );

        if (!result) {

            console.log(
                'NO SOLUTION'
            );

            continue;
        }

        /*
            Deduplicate
        */

        const signature =

            result.bundles

            .map(
                bundle =>
                    bundle.bundleId
            )

            .sort()

            .join('|');

        if (
            seen.has(
                signature
            )
        ) {

            continue;
        }

        seen.add(
            signature
        );

        schedules.push({

            anchor,

            bundles:
                result.bundles
        });
    }

    return schedules;
}


