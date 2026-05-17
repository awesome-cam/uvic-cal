const DAYS = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri'
];

const TERM_LABELS = {

    '202609':
        'Semester 1',

    '202701':
        'Semester 2'
};

const CALENDAR_START =
    8 * 60;

const CALENDAR_END =
    22 * 60;

const PIXELS_PER_MINUTE =
    1;

function formatMinutes(
    totalMinutes
) {

    const hours24 =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;

    const suffix =
        hours24 >= 12
            ? 'PM'
            : 'AM';

    let hours12 =
        hours24 % 12;

    if (
        hours12 === 0
    ) {

        hours12 = 12;
    }

    return (

        hours12 +
        ':' +
        minutes
            .toString()
            .padStart(2, '0') +

        ' ' +

        suffix
    );
}

function renderTimeLabels() {

    let html = '';

    for (
        let hour = 8;
        hour <= 22;
        hour++
    ) {

        const minutes =
            hour * 60;

        html += `

            <div
                class="calendar-time-label"
                style="
                    position:absolute;
                    top:${
                        (
                            minutes -
                            CALENDAR_START
                        ) *

                        PIXELS_PER_MINUTE
                    }px;
                    left:0;
                    width:60px;
                    height:60px;
                    font-size:12px;
                    border-top:1px solid #ddd;
                "
            >

                ${formatMinutes(
                    minutes
                )}

            </div>

        `;
    }

    return html;
}

function renderMeetingBlock(
    section,
    meeting
) {

    const dayIndex =
        DAYS.indexOf(
            meeting.day
        );

    if (
        dayIndex === -1
    ) {

        return '';
    }

    const top =
        (
            meeting.startMinutes -
            CALENDAR_START
        ) *

        PIXELS_PER_MINUTE;

    const height =
        (
            meeting.endMinutes -
            meeting.startMinutes
        ) *

        PIXELS_PER_MINUTE;

    const left =
        60 + (dayIndex * 140);

    return `

        <div

            style="
                position:absolute;

                left:${left}px;

                top:${top}px;

                width:130px;

                height:${height}px;

                border:1px solid #333;

                border-radius:6px;

                padding:4px;

                overflow:hidden;

                font-size:11px;

                background:#f3f3f3;
            "
        >

            <strong>
                ${section.course}
            </strong>

            <br>

            ${section.sequence}

            <br>

            CRN:
            ${section.crn}

        </div>

    `;
}

function renderTermCalendar(
    term,
    sections
) {

    const height =
        (
            CALENDAR_END -
            CALENDAR_START
        ) *

        PIXELS_PER_MINUTE;

    let blocks = '';

    for (
        const section of
        sections
    ) {

        for (
            const meeting of
            section.meetings
        ) {

            blocks +=
                renderMeetingBlock(
                    section,
                    meeting
                );
        }
    }

    const dayHeaders =
        DAYS.map(

            (
                day,
                index
            ) => `

                <div
                    style="
                        position:absolute;
                        left:${60 + (index * 140)}px;
                        top:-30px;
                        width:130px;
                        text-align:center;
                        font-weight:bold;
                    "
                >

                    ${day}

                </div>

            `
        ).join('');

    return `

        <div
            class="term-calendar-wrapper"
            style="
                margin-bottom:60px;
            "
        >

            <h3>

                ${TERM_LABELS[term] || term}

            </h3>

            <div
                style="
                    position:relative;

                    width:800px;

                    height:${height}px;

                    border:1px solid #ccc;

                    margin-top:40px;

                    background:white;
                "
            >

                ${dayHeaders}

                ${renderTimeLabels()}

                ${blocks}

            </div>

        </div>

    `;
}

function renderCrnSummary(
    schedule
) {

    return `

        <div
            style="
                margin-top:20px;
                padding:10px;
                border-top:1px solid #ddd;
            "
        >

            <strong>
                All CRNs:
            </strong>

            ${schedule.crns.join(', ')}

        </div>

    `;
}

function renderSchedule(
    schedule,
    index
) {

    const termCalendars =
        Object.entries(
            schedule.terms
        )

        .sort(
            (
                a,
                b
            ) =>

                a[0].localeCompare(
                    b[0]
                )
        )

        .map(

            (
                [
                    term,
                    sections
                ]
            ) =>

                renderTermCalendar(
                    term,
                    sections
                )
        )

        .join('');

    return `

        <div
            class="schedule-card"
            style="
                margin-bottom:60px;
            "
        >

            <h2>

                Schedule ${index + 1}

            </h2>

            ${termCalendars}

            ${renderCrnSummary(
                schedule
            )}

        </div>

    `;
}

function renderSchedules(
    schedules
) {

    if (
        schedules.length === 0
    ) {

        return `

            <div class="error">

                No valid schedules found.

            </div>

        `;
    }

    /*
        IMPORTANT:

        Only render ONE schedule
        for now.

        This keeps rendering
        extremely fast.
    */

    return renderSchedule(
        schedules[0],
        0
    );
}

