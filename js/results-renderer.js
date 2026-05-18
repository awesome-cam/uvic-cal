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

const COURSE_COLORS = [

    '#FFCDD2',
    '#F8BBD0',
    '#E1BEE7',
    '#D1C4E9',
    '#C5CAE9',
    '#BBDEFB',

    '#B2DFDB',
    '#C8E6C9',
    '#DCEDC8',
    '#FFF9C4',
    '#FFE0B2',
    '#FFCCBC'
];

let currentScheduleIndex = 0;

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

function getCourseColorMap(
    schedule
) {

    const map = {};

    let colorIndex = 0;

    for (
        const section of
        schedule.sections
    ) {

        if (
            !map[
                section.course
            ]
        ) {

            map[
                section.course
            ] =

                COURSE_COLORS[
                    colorIndex %
                    COURSE_COLORS.length
                ];

            colorIndex++;
        }
    }

    return map;
}

function getComponentShortName(
    section
) {

    const type =
        (
            section.type || ''
        )

        .toLowerCase();

    if (
        type.includes(
            'lecture'
        )
    ) {

        return 'LEC';
    }

    if (
        type.includes(
            'lab'
        )
    ) {

        return 'LAB';
    }

    if (
        type.includes(
            'tutorial'
        )
    ) {

        return 'TUT';
    }

    return 'SEC';
}

function sectionIsAsync(
    section
) {

    return (

        (
            !section.meetings
        )

        ||

        (
            section.meetings.length
            === 0
        )
    );
}

function getAsyncLabel(
    section
) {

    const method = (

        section
            .instructionalMethodDescription

        ||

        ''
    )

    .toLowerCase();

    if (
        method.includes(
            'online'
        )
    ) {

        return '(Online Async)';
    }

    return '(TBA Days/Times)';
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

                    box-sizing:border-box;
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
    meeting,
    color
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

                border:1px solid #444;

                border-radius:8px;

                padding:4px;

                overflow:hidden;

                font-size:11px;

                background:${color};

                box-sizing:border-box;

                box-shadow:
                    0 1px 2px rgba(
                        0,
                        0,
                        0,
                        0.15
                    );
            "
        >

            <strong>
                ${section.course}
            </strong>

            <br>

            ${getComponentShortName(
                section
            )}

            <br>

            ${section.sequence}

            <br>

            <strong>
                ${section.crn}
            </strong>

        </div>

    `;
}

function renderTermCalendar(
    term,
    sections,
    colorMap
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

        if (
            sectionIsAsync(
                section
            )
        ) {

            continue;
        }

        const color =
            colorMap[
                section.course
            ];

        for (
            const meeting of
            section.meetings
        ) {

            blocks +=
                renderMeetingBlock(
                    section,
                    meeting,
                    color
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

    const rows =
        schedule.sections.map(
            section => {

                const asyncLabel =
                    sectionIsAsync(
                        section
                    )

                    ? getAsyncLabel(
                        section
                    )

                    : '';

                return `

                    <tr>

                        <td>
                            ${section.course}
                        </td>

                        <td>
                            ${getComponentShortName(
                                section
                            )}
                        </td>

                        <td>
                            ${section.sequence}
                        </td>

                        <td>

                            <strong>
                                ${section.crn}
                            </strong>

                            <div
                                style="
                                    font-size:12px;
                                    color:#666;
                                    margin-top:2px;
                                "
                            >

                                ${
                                    section
                                        .instructionalMethodDescription
                                    ||
                                    ''
                                }

                            </div>

                            ${
                                asyncLabel
                                    ? `
                                        <div
                                            style="
                                                font-size:12px;
                                                color:#aa0000;
                                                margin-top:2px;
                                            "
                                        >
                                            ${asyncLabel}
                                        </div>
                                    `
                                    : ''
                            }

                        </td>

                    </tr>

                `;
            }
        ).join('');

    return `

        <div
            style="
                margin-top:20px;
            "
        >

            <table
                style="
                    border-collapse:collapse;
                    width:100%;
                    max-width:700px;
                "
            >

                <tr>

                    <th align="left">
                        Course
                    </th>

                    <th align="left">
                        Type
                    </th>

                    <th align="left">
                        Section
                    </th>

                    <th align="left">
                        CRN / Delivery
                    </th>

                </tr>

                ${rows}

            </table>

        </div>

    `;
}

function renderScoreSummary(
    schedule
) {

    const scores =
        schedule.scores || {};

    return `

        <div
            style="
                margin-bottom:20px;
                padding:12px;
                border:1px solid #ddd;
                border-radius:8px;
                background:#fafafa;
                max-width:700px;
            "
        >

            <div>

                <strong>
                    Overall Score:
                </strong>

                ${scores.total ?? '?'}

            </div>

            <div style="margin-top:8px;">

                Course Match:
                ${scores.course ?? '?'}

                |
                Semester Balance:
                ${scores.balance ?? '?'}

                |
                Compactness:
                ${scores.compact ?? '?'}

                |
                Smoothness:
                ${scores.breaks ?? '?'}

            </div>

        </div>

    `;
}

function renderSchedule(
    schedule,
    index,
    totalSchedules
) {

    const colorMap =
        getCourseColorMap(
            schedule
        );

    const termCalendars = `

        <div class="calendar-grid">

            ${Object.entries(
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
                        sections,
                        colorMap
                    )
            )

            .join('')}

        </div>
    `;

    return `

        <div
            class="schedule-card"
            style="
                margin-bottom:60px;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                    margin-bottom:20px;
                "
            >

                <button
                    onclick="
                        previousSchedule()
                    "
                >

                    Previous

                </button>

                <strong>

                    Schedule
                    ${index + 1}
                    of
                    ${totalSchedules}

                </strong>

                <button
                    onclick="
                        nextSchedule()
                    "
                >

                    Next

                </button>

            </div>

            ${renderScoreSummary(
                schedule
            )}

            ${termCalendars}

            ${renderCrnSummary(
                schedule
            )}

        </div>

    `;
}

let lastSchedules = [];

function rerenderSchedules() {

    const output =
        document.getElementById(
            'validationOutput'
        );

    output.innerHTML = `

        <div class="success">

            Found
            ${lastSchedules.length}
            schedules.

        </div>

        ${renderSchedule(
            lastSchedules[
                currentScheduleIndex
            ],
            currentScheduleIndex,
            lastSchedules.length
        )}

    `;
}

function previousSchedule() {

    if (
        currentScheduleIndex > 0
    ) {

        currentScheduleIndex--;

        rerenderSchedules();
    }
}

function nextSchedule() {

    if (

        currentScheduleIndex <
        lastSchedules.length - 1
    ) {

        currentScheduleIndex++;

        rerenderSchedules();
    }
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

    lastSchedules =
        schedules;

    currentScheduleIndex =
        0;

    return renderSchedule(
        schedules[0],
        0,
        schedules.length
    );
}
