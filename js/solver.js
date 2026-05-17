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

    const schedules = [];

    function backtrack(
        index,
        currentSchedule
    ) {

        if (
            index ===
            allCourseSections.length
        ) {

            schedules.push([
                ...currentSchedule
            ]);

            return;
        }

        const currentSections =
            allCourseSections[index];

        for (
            const section of
            currentSections
        ) {

            let hasConflict = false;

            for (
                const existing of
                currentSchedule
            ) {

                if (

                    sectionsConflict(
                        section,
                        existing
                    )
                ) {

                    hasConflict = true;
                    break;
                }
            }

            if (!hasConflict) {

                currentSchedule.push(
                    section
                );

                backtrack(
                    index + 1,
                    currentSchedule
                );

                currentSchedule.pop();
            }
        }
    }

    backtrack(0, []);

    return schedules;
}
