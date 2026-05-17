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

            allCourseBundles.push(
                bundles
            );
        }
    }

    const schedules = [];

    function backtrack(
        index,
        currentBundles
    ) {

        if (
            index ===
            allCourseBundles.length
        ) {

            schedules.push(

                buildScheduleObject(
                    currentBundles
                )
            );

            return;
        }

        const candidateBundles =
            allCourseBundles[index];

        for (
            const bundle of
            candidateBundles
        ) {

            let hasConflict =
                false;

            for (
                const existing of
                currentBundles
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

                currentBundles.push(
                    bundle
                );

                backtrack(
                    index + 1,
                    currentBundles
                );

                currentBundles.pop();
            }
        }
    }

    backtrack(0, []);

    return schedules;
}

