function semesterMatches(
    requestedSemester,
    actualTerm
) {

    if (
        requestedSemester ===
        'Either'
    ) {

        return true;
    }

    if (
        requestedSemester ===
        'Sept'
    ) {

        return (
            actualTerm ===
            '202609'
        );
    }

    if (
        requestedSemester ===
        'Jan'
    ) {

        return (
            actualTerm ===
            '202701'
        );
    }

    return false;
}

async function validateCourse(
    course
) {

    const errors = [];

    const code =
        course.code
            .trim()
            .toUpperCase();

    if (!code) {

        return errors;
    }

    const parsed =
        parseCourseCode(
            code
        );

    if (!parsed) {

        errors.push(

            `${code} is not a valid course format`
        );

        return errors;
    }

    const matches =
        await getCourseMatches(
            code
        );

    if (
        matches.length === 0
    ) {

        errors.push(
            `${code} was not found`
        );

        return errors;
    }

    const matchingSemester =
        matches.some(
            section =>

                semesterMatches(
                    course.semester,
                    section.term
                )
        );

    if (
        !matchingSemester
    ) {

        errors.push(

            `${code} is not available in ${course.semester}`
        );
    }

    if (
        Number.isNaN(
            course.priority
        )
    ) {

        errors.push(

            `${code} has an invalid priority`
        );
    }

    return errors;
}

function validateGroups(
    groups
) {

    const errors = [];

    if (
        !Array.isArray(
            groups
        )
    ) {

        errors.push(
            'Groups must be an array'
        );

        return errors;
    }

    groups.forEach(

        (
            group,
            index
        ) => {

            if (
                !Array.isArray(
                    group.courses
                )
            ) {

                errors.push(

                    `Group ${index + 1} is missing courses`
                );

                return;
            }

            if (
                group.courses.length === 0
            ) {

                errors.push(

                    `Group ${index + 1} has no courses`
                );
            }

            if (
                group.pick <
                1
            ) {

                errors.push(

                    `Group ${index + 1} must pick at least 1 course`
                );
            }

            if (
                group.pick >
                group.courses.length
            ) {

                errors.push(

                    `Group ${index + 1} cannot pick more courses than exist`
                );
            }
        }
    );

    return errors;
}

function validateAvailability(
    availability
) {

    const errors = [];

    if (!availability) {

        errors.push(
            'Availability settings are missing'
        );

        return errors;
    }

    return errors;
}

function validatePreferences(
    preferences
) {

    const errors = [];

    if (!preferences) {

        errors.push(
            'Preferences are missing'
        );

        return errors;
    }

    return errors;
}

async function validateRequest(
    request
) {

    const errors = [];

    if (!request) {

        return {

            valid: false,

            errors: [
                'Request is missing'
            ]
        };
    }

    errors.push(

        ...validateGroups(
            request.groups
        )
    );

    errors.push(

        ...validateAvailability(

            request
                .hardConstraints
                ?.availability
        )
    );

    errors.push(

        ...validatePreferences(

            request
                .softPreferences
        )
    );

    for (
        const group of
        request.groups || []
    ) {

        for (
            const course of
            group.courses || []
        ) {

            const courseErrors =
                await validateCourse(
                    course
                );

            errors.push(
                ...courseErrors
            );
        }
    }

    return {

        valid:
            errors.length === 0,

        errors
    };
}

