const CALENDAR_DAYS = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
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

const TIME_LABEL_WIDTH =
    60;

const DAY_COLUMN_WIDTH =
    100;

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

                    width:${TIME_LABEL_WIDTH}px;

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
        CALENDAR_DAYS.indexOf(
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
        TIME_LABEL_WIDTH +

        (
            dayIndex *
            DAY_COLUMN_WIDTH
        );

    return `

        <div

            style="
                position:absolute;

                left:${left}px;

                top:${top}px;

                width:${
                    DAY_COLUMN_WIDTH - 10
                }px;

                height:${height}px;

                border:1px solid #333;

                border-radius:6px;

                padding:4px;

                overflow:hidden;

                font-size:11px;

                background:#f3f3f3;

                box-sizing:border-box;
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
        CALENDAR_DAYS.map(

            (
                day,
                index
            ) => `

                <div
                    style="
                        position:absolute;

                        left:${
                            TIME_LABEL_WIDTH +

                            (
                                index *
                                DAY_COLUMN_WIDTH
                            )
                        }px;

                        top:-30px;

                        width:${
                            DAY_COLUMN_WIDTH - 10
                        }px;

                        text-align:center;

                        font-weight:bold;
                    "
                >

                    ${day}

                </div>

            `
        ).join('');

    const calendarWidth =

        TIME_LABEL_WIDTH +

        (
            CALENDAR_DAYS.length *
            DAY_COLUMN_WIDTH
        );

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

                    width:${calendarWidth}px;

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

    return renderSchedule(
        schedules[0],
        0
    );
}

