const courseDataCache = {};

async function loadSubjectTerm(
    subject,
    term
) {

    const key =
        `${subject}-${term}`;

    if (courseDataCache[key]) {

        return courseDataCache[key];
    }

    try {

        const response =
            await fetch(
                `data/${subject}-${term}.json`
            );

        if (!response.ok) {

            return null;
        }

        const json =
            await response.json();

        courseDataCache[key] =
            json;

        return json;
    }
    catch {

        return null;
    }
}

function parseCourseCode(code) {

    const cleaned =
        code
            .trim()
            .toUpperCase();

    const match =
        cleaned.match(
            /^([A-Z]+)([0-9A-Z]+)$/
        );

    if (!match) {

        return null;
    }

    return {

        subject: match[1],
        courseNumber: match[2]
    };
}

async function getCourseMatches(
    courseCode
) {

    const parsed =
        parseCourseCode(
            courseCode
        );

    if (!parsed) {

        return [];
    }

    const sept =
        await loadSubjectTerm(
            parsed.subject,
            '202609'
        );

    const jan =
        await loadSubjectTerm(
            parsed.subject,
            '202701'
        );

    const allSections = [

        ...(sept?.data || []),

        ...(jan?.data || [])
    ];

    return allSections.filter(
        section =>

            section.courseNumber ===
            parsed.courseNumber
    );
}

async function courseExists(
    courseCode
) {

    const matches =
        await getCourseMatches(
            courseCode
        );

    return matches.length > 0;
}

