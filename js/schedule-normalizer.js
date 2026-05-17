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

    if (
        meetingTime.monday
    ) {

        meetings.push({

            day: 'Mon',

            startMinutes,
            endMinutes
        });
    }

    if (
        meetingTime.tuesday
    ) {

        meetings.push({

            day: 'Tue',

            startMinutes,
            endMinutes
        });
    }

    if (
        meetingTime.wednesday
    ) {

        meetings.push({

            day: 'Wed',

            startMinutes,
            endMinutes
        });
    }

    if (
        meetingTime.thursday
    ) {

        meetings.push({

            day: 'Thu',

            startMinutes,
            endMinutes
        });
    }

    if (
        meetingTime.friday
    ) {

        meetings.push({

            day: 'Fri',

            startMinutes,
            endMinutes
        });
    }

    if (
        meetingTime.saturday
    ) {

        meetings.push({

            day: 'Sat',

            startMinutes,
            endMinutes
        });
    }

    if (
        meetingTime.sunday
    ) {

        meetings.push({

            day: 'Sun',

            startMinutes,
            endMinutes
        });
    }

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

        term:
            rawSection.term,

        title:
            rawSection.courseTitle,

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

