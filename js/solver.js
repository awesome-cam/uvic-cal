const MAX_SCHEDULES = 10;

function bundlesConflict(
    bundleA,
    bundleB
) {

    if (
        bundleA.term !==
        bundleB.term
    ) {

        return false;
    }

    for (
        const sectionA of
        bundleA.sections
    ) {

        for (
            const sectionB of
            bundleB.sections
        ) {

            if (

                sectionsConflict(
                    sectionA,
                    sectionB
                )
            ) {

                return true;
            }
        }
    }

    return false;
}

function buildScheduleObject(
    bundles
) {

    const sections =
        bundles.flatMap(
            bundle =>
                bundle.sections
        );

    const crns =
        sections.map(
            section =>
                section.crn
        );

    const terms = {};

    for (
        const section of
        sections
    ) {

        if (
            !terms[
                section.term
            ]
        ) {

            terms[
                section.term
            ] = [];
        }

        terms[
            section.term
        ].push(section);
    }

    return {

        bundles,

        sections,

        crns,

        terms,

        score: 0
    };
}

function shuffleArray(
    array
) {

    const copy =
        [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}

function sortBundlesByCompactness(
    bundles
) {

    return [...bundles].sort(
        (
            a,
            b
        ) =>

            a.meetings.length -
            b.meetings.length
    );
}

function tryBuildGreedySchedule(
    allCourseBundles
) {

    const chosenBundles = [];

    for (
        const courseBundles of
        allCourseBundles
    ) {

        const shuffled =
            shuffleArray(
                courseBundles
            );

        const sorted =
            sortBundlesByCompactness(
                shuffled
            );

        let selectedBundle =
            null;

        for (
            const bundle of
            sorted
        ) {

            let hasConflict =
                false;

            for (
                const existing of
                chosenBundles
            ) {

                if (

                    bundlesConflict(
                        bundle,
                        existing
                    )
                ) {

                    hasConflict =
                        true;

                    break;
                }
            }

            if (
                !hasConflict
            ) {

                selectedBundle =
                    bundle;

                break;
            }
        }

        if (
            !selectedBundle
        ) {

            return null;
        }

        chosenBundles.push(
            selectedBundle
        );
    }

    return buildScheduleObject(
        chosenBundles
    );
}

function scheduleSignature(
    schedule
) {

    return schedule.crns

        .slice()

        .sort()

        .join('-');
}

async function generateSchedules(
    request
) {

    const allCourseBundles = [];

    for (
        const group of request.groups
    ) {

        for (
            const course of
            group.courses
        ) {

            const matches =
                await getCourseMatches(
                    course.code
                );

            const bundles =
                buildCourseBundles(
                    matches
                );

            if (
                bundles.length === 0
            ) {

                return [];
            }

            allCourseBundles.push(
                bundles
            );
        }
    }

    /*
        Solve hardest courses first.
    */

    allCourseBundles.sort(
        (
            a,
            b
        ) =>

            a.length -
            b.length
    );

    const schedules = [];

    const seen =
        new Set();

    let attempts = 0;

    const MAX_ATTEMPTS = 100;

    while (

        schedules.length <
        MAX_SCHEDULES

        &&

        attempts <
        MAX_ATTEMPTS
    ) {

        attempts++;

        const schedule =
            tryBuildGreedySchedule(
                allCourseBundles
            );

        if (
            !schedule
        ) {

            continue;
        }

        const signature =
            scheduleSignature(
                schedule
            );

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

        schedules.push(
            schedule
        );
    }

    return schedules;
}

