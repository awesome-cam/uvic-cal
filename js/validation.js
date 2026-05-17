async function validateRequest(
    request
) {

    const errors = [];

    for (const group of request.groups) {

        for (const course of group.courses) {

            const code =
                course.code
                    .trim()
                    .toUpperCase();

            if (!code) {

                continue;
            }

            const parsed =
                parseCourseCode(code);

            if (!parsed) {

                errors.push(
                    `${code} is not a valid course format`
                );

                continue;
            }

            const matches =
                await getCourseMatches(
                    code
                );

            if (matches.length === 0) {

                errors.push(
                    `${code} was not found`
                );

                continue;
            }

            if (
                course.semester !==
                'Either'
            ) {

                const matchingSemester =
                    matches.some(section => {

                        if (
                            course.semester ===
                            'Sept'
                        ) {

                            return (
                                section.term ===
                                '202609'
                            );
                        }

                        if (
                            course.semester ===
                            'Jan'
                        ) {

                            return (
                                section.term ===
                                '202701'
                            );
                        }

                        return false;
                    });

                if (!matchingSemester) {

                    errors.push(

                        `${code} is not available in ${course.semester}`
                    );
                }
            }
        }
    }

    return {

        valid:
            errors.length === 0,

        errors
    };
}

