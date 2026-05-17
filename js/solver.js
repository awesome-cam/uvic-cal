async function generateSchedules(
    request
) {

    const allCourseSections = [];

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

            const normalized =
                normalizeSections(
                    matches
                );

            allCourseSections.push(
                normalized
            );
        }
    }

    if (
        allCourseSections.length === 1
    ) {

        return allCourseSections[0]
            .map(section => [

                section
            ]);
    }

    if (
        allCourseSections.length === 2
    ) {

        const schedules = [];

        for (
            const sectionA of
            allCourseSections[0]
        ) {

            for (
                const sectionB of
                allCourseSections[1]
            ) {

                if (

                    !sectionsConflict(
                        sectionA,
                        sectionB
                    )
                ) {

                    schedules.push([

                        sectionA,
                        sectionB
                    ]);
                }
            }
        }

        return schedules;
    }

    return [];
}

