async function validateRequest(
    request
) {

    const errors = [];

    /*
        Validate groups exist
    */

    if (
        !request.groups ||
        request.groups.length === 0
    ) {

        errors.push(
            'At least one course group is required.'
        );

        return {

            valid: false,
            errors
        };
    }

    /*
        Track duplicates globally
    */

    const seenCourses =
        new Set();

    for (
        let groupIndex = 0;
        groupIndex < request.groups.length;
        groupIndex++
    ) {

        const group =
            request.groups[groupIndex];

        /*
            Validate group size
        */

        if (
            !group.courses ||
            group.courses.length === 0
        ) {

            errors.push(

                `Course Group ${groupIndex + 1} ` +

                `contains no courses.`
            );

            continue;
        }

        /*
            Validate pick count
        */

        if (
            group.pick < 1
        ) {

            errors.push(

                `Course Group ${groupIndex + 1} ` +

                `must choose at least 1 course.`
            );
        }

        if (
            group.pick >
            group.courses.length
        ) {

            errors.push(

                `Course Group ${groupIndex + 1} ` +

                `cannot choose ${group.pick} ` +

                `courses from only ` +

                `${group.courses.length} options.`
            );
        }

        for (
            const course of
            group.courses
        ) {

            /*
                Validate code exists
            */

            if (
                !course.code
            ) {

                errors.push(

                    `Empty course code ` +

                    `in Course Group ` +

                    `${groupIndex + 1}.`
                );

                continue;
            }

            /*
                Duplicate detection
            */

            if (
                seenCourses.has(
                    course.code
                )
            ) {

                errors.push(

                    `${course.code} ` +

                    `appears more than once.`
                );
            }

            seenCourses.add(
                course.code
            );

            /*
                Validate course exists
            */

            const matches =
                await getCourseMatches(
                    course.code
                );

            if (
                matches.length === 0
            ) {

                errors.push(

                    `${course.code} ` +

                    `does not exist.`
                );

                continue;
            }

            /*
                Validate semester restriction
            */

            if (
                course.semester ===
                'Sept'
            ) {

                const hasSept =
                    matches.some(
                        section =>

                            section.term ===
                            '202609'
                    );

                if (!hasSept) {

                    errors.push(

                        `${course.code} ` +

                        `does not exist ` +

                        `in Sept semester.`
                    );
                }
            }

            if (
                course.semester ===
                'Jan'
            ) {

                const hasJan =
                    matches.some(
                        section =>

                            section.term ===
                            '202701'
                    );

                if (!hasJan) {

                    errors.push(

                        `${course.code} ` +

                        `does not exist ` +

                        `in Jan semester.`
                    );
                }
            }

            /*
                Validate priority
            */

            if (

                typeof course.priority !==
                'number'

                ||

                course.priority < 1

                ||

                course.priority > 5
            ) {

                errors.push(

                    `${course.code} ` +

                    `priority must be ` +

                    `between 1 and 5.`
                );
            }
        }
    }

    return {

        valid:
            errors.length === 0,

        errors
    };
}

