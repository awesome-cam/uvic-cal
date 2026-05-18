function hhmmToMinutes(hhmm) {

    if (!hhmm) {
        return null;
    }

    const text =
        hhmm.toString()
            .padStart(4, '0');

    const hours =
        parseInt(
            text.slice(0, 2)
        );

    const minutes =
        parseInt(
            text.slice(2, 4)
        );

    return (
        hours * 60 +
        minutes
    );
}

function normalizeMeeting(
    meetingTime
) {

    const meetings = [];

    const startMinutes =
        hhmmToMinutes(
            meetingTime.beginTime
        );

    const endMinutes =
        hhmmToMinutes(
            meetingTime.endTime
        );

    function addMeeting(
        enabled,
        day
    ) {

        if (!enabled) {
            return;
        }

        meetings.push({

            day,

            startMinutes,
            endMinutes
        });
    }

    addMeeting(
        meetingTime.monday,
        'Mon'
    );

    addMeeting(
        meetingTime.tuesday,
        'Tue'
    );

    addMeeting(
        meetingTime.wednesday,
        'Wed'
    );

    addMeeting(
        meetingTime.thursday,
        'Thu'
    );

    addMeeting(
        meetingTime.friday,
        'Fri'
    );

    addMeeting(
        meetingTime.saturday,
        'Sat'
    );

    addMeeting(
        meetingTime.sunday,
        'Sun'
    );

    return meetings;
}

function normalizeSection(
    rawSection
) {

    const meetings = [];

    for (
        const item of
        rawSection.meetingsFaculty || []
    ) {

        if (
            !item.meetingTime
        ) {

            continue;
        }

        meetings.push(

            ...normalizeMeeting(
                item.meetingTime
            )
        );
    }

    const type =
        (
            rawSection
                .scheduleTypeDescription || ''
        )

        .trim()
        .toLowerCase();

    let componentType =
        'other';

    if (
        type.includes(
            'lecture'
        )
    ) {

        componentType =
            'lecture';
    }
    else if (
        type.includes(
            'lab'
        )
    ) {

        componentType =
            'lab';
    }
    else if (
        type.includes(
            'tutorial'
        )
    ) {

        componentType =
            'tutorial';
    }

    return {

        crn:
            rawSection
                .courseReferenceNumber,

        course:

            rawSection.subject +
            rawSection.courseNumber,

        subject:
            rawSection.subject,

        courseNumber:
            rawSection.courseNumber,

        sequence:
            rawSection.sequenceNumber,

        type:
            rawSection
                .scheduleTypeDescription,

        componentType,

        term:
            rawSection.term,

        title:
            rawSection.courseTitle,

        instructionalMethod:
            rawSection
                .instructionalMethod,


        delivery:
            rawSection
                .instructionalMethodDescription,

        meetings
    };
}

function normalizeSections(
    rawSections
) {

    return rawSections.map(
        normalizeSection
    );
}

function sectionsInternallyConflict(
    sections
) {

    for (
        let i = 0;
        i < sections.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < sections.length;
            j++
        ) {

            if (

                sectionsConflict(
                    sections[i],
                    sections[j]
                )
            ) {

                return true;
            }
        }
    }

    return false;
}

function buildBundle(
    sections
) {

    const meetings =
        sections.flatMap(
            section =>
                section.meetings
        );

    const crns =
        sections.map(
            section =>
                section.crn
        );

    return {

        bundleId:
            crns.join('-'),

        course:
            sections[0]
                .course,

        term:
            sections[0]
                .term,

        title:
            sections[0]
                .title,

        sections,

        meetings,

        crns
    };
}

function buildCourseBundles(
    rawSections
) {

    const normalized =
        normalizeSections(
            rawSections
        );

    const grouped =
        {};

    for (
        const section of
        normalized
    ) {

        /*
            Ignore weird Banner
            component types for now.
        */

        if (
            section.componentType ===
            'other'
        ) {

            continue;
        }

        const key =

            section.course +
            '-' +
            section.term;

        if (!grouped[key]) {

            grouped[key] = {

                lectures: [],
                labs: [],
                tutorials: []
            };
        }

        if (
            section.componentType ===
            'lecture'
        ) {

            grouped[key]
                .lectures
                .push(section);
        }
        else if (
            section.componentType ===
            'lab'
        ) {

            grouped[key]
                .labs
                .push(section);
        }
        else if (
            section.componentType ===
            'tutorial'
        ) {

            grouped[key]
                .tutorials
                .push(section);
        }
    }

    const bundles = [];

    for (
        const group of
        Object.values(
            grouped
        )
    ) {

        const lectures =
            group.lectures.length > 0
                ? group.lectures
                : [null];

        const labs =
            group.labs.length > 0
                ? group.labs
                : [null];

        const tutorials =
            group.tutorials.length > 0
                ? group.tutorials
                : [null];

        for (
            const lecture of
            lectures
        ) {

            for (
                const lab of
                labs
            ) {

                for (
                    const tutorial of
                    tutorials
                ) {

                    const sections = [

                        lecture,
                        lab,
                        tutorial
                    ]

                    .filter(Boolean);

                    if (
                        sections.length === 0
                    ) {

                        continue;
                    }

                    if (

                        sectionsInternallyConflict(
                            sections
                        )
                    ) {

                        continue;
                    }

                    bundles.push(

                        buildBundle(
                            sections
                        )
                    );
                }
            }
        }
    }

    const deduped =
        new Map();

    for (
        const bundle of
        bundles
    ) {

        deduped.set(
            bundle.bundleId,
            bundle
        );
    }

    return [
        ...deduped.values()
    ];
}

