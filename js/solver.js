const MAX_SCHEDULES = 5;

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
        ].push(
            section
        );
    }

    return {

        bundles,

        sections,

        crns,

        terms,

        score: 0
    };
}

async function buildAllCourseBundles(
    request
) {

    const allCourseBundles = [];

    for (
        const group of
        request.groups
    ) {

        const courseBundles = [];

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

            courseBundles.push(
                ...bundles
            );
        }

        allCourseBundles.push(
            courseBundles
        );
    }

    return allCourseBundles;
}

async function generateSchedules(
    request
) {

    console.log(
        'SENDING REQUEST',
        request
    );

    const allCourseBundles =
        await buildAllCourseBundles(
            request
        );

    console.log(
        'ALL COURSE BUNDLES',
        allCourseBundles
    );

    const response =
        await fetch(

            'http://127.0.0.1:8000/solve',

            {

                method: 'POST',

                headers: {

                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({

                    data: {

                        request,

                        allCourseBundles
                    }
                })
            }
        );

    const result =
        await response.json();

    console.log(
        'BACKEND RESPONSE',
        result
    );

    if (
        !result.success
    ) {

        return [];
    }

    const schedules = [];

    for (
        const backendSchedule of
        result.schedules
    ) {

        const schedule =
            buildScheduleObject(
                backendSchedule.bundles
            );

        schedules.push(
            schedule
        );
    }

    console.log(
        'FINAL SCHEDULES',
        schedules
    );

    return schedules;
}
