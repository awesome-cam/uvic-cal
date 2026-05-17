const MAX_SCHEDULES = 5;

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

    /*
        Gather all bundles
    */

    const allBundles = [];

    for (
        const group of
        request.groups
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

            for (
                const bundle of
                bundles
            ) {

                allBundles.push(
                    bundle
                );
            }
        }
    }

    console.log(
        'ALL BUNDLES',
        allBundles
    );

    /* EKAB */
    console.log(
        'BUNDLE COUNT',
        allBundles.length
    );

    /*
        Generate candidate
        schedules using
        lecture anchors
    */

    const candidateSchedules =

        await generateCandidateSchedules(

            request,

            allBundles
        );

    console.log(
        'CANDIDATE SCHEDULES',
        candidateSchedules
    );

    /*
        Convert into existing
        renderer format
    */

    const schedules =
        candidateSchedules.map(

            candidate =>

                buildScheduleObject(
                    candidate.bundles
                )
        );

    return schedules.slice(
        0,
        MAX_SCHEDULES
    );
}
