const COURSE_SEARCH_TERM_LABELS = {
    "202609": "Sept",
    "202701": "Jan"
};

function courseSearchParseCourseCode(input) {

    const trimmed = input.trim().toUpperCase();

    const match = trimmed.match(/^([A-Z]+)\s*([0-9A-Z]+)$/);

    if (!match) {
        return null;
    }

    return {
        subject: match[1],
        courseNumber: match[2]
    };
}

function courseSearchFormatDays(meetingTime) {

    const days = [];

    if (meetingTime.monday) days.push('Mon');
    if (meetingTime.tuesday) days.push('Tue');
    if (meetingTime.wednesday) days.push('Wed');
    if (meetingTime.thursday) days.push('Thu');
    if (meetingTime.friday) days.push('Fri');
    if (meetingTime.saturday) days.push('Sat');
    if (meetingTime.sunday) days.push('Sun');

    return days.join(' ');
}

function courseSearchFormatTime(timeString) {

    if (!timeString) {
        return 'TBA';
    }

    const hours = parseInt(timeString.slice(0, 2));
    const minutes = timeString.slice(2);

    const suffix = hours >= 12 ? 'PM' : 'AM';

    const adjustedHours =
        hours % 12 === 0
            ? 12
            : hours % 12;

    return `${adjustedHours}:${minutes} ${suffix}`;
}

async function courseSearchLoadTermData(
    subject,
    term
) {

    const fileName =
        `data/${subject}-${term}.json`;

    try {

        const response =
            await fetch(fileName);

        if (!response.ok) {

            console.log(
                `Missing term file: ${fileName}`
            );

            return null;
        }

        return await response.json();
    }
    catch (err) {

        console.log(
            `Failed loading: ${fileName}`
        );

        console.log(err);

        return null;
    }
}

function courseSearchSortSections(
    a,
    b
) {

    const termOrder = {
        '202609': 0,
        '202701': 1
    };

    if (
        termOrder[a.term] !==
        termOrder[b.term]
    ) {

        return (
            termOrder[a.term] -
            termOrder[b.term]
        );
    }

    const typeA =
        a.scheduleTypeDescription === 'Lecture'
            ? 0
            : 1;

    const typeB =
        b.scheduleTypeDescription === 'Lecture'
            ? 0
            : 1;

    if (typeA !== typeB) {

        return typeA - typeB;
    }

    return a.sequenceNumber.localeCompare(
        b.sequenceNumber
    );
}

function courseSearchBuildMeetingString(
    section
) {

    const meetings = [];

    for (
        const meeting of
        section.meetingsFaculty
    ) {

        const mt =
            meeting.meetingTime;

        meetings.push(

            `${courseSearchFormatDays(mt)} ` +

            `${courseSearchFormatTime(mt.beginTime)}` +

            `-` +

            `${courseSearchFormatTime(mt.endTime)}`
        );
    }

    return meetings.join(' | ');
}

async function courseSearchRun() {

    const input =
        document.getElementById(
            'courseInput'
        ).value;

    const status =
        document.getElementById(
            'status'
        );

    const currentCourse =
        document.getElementById(
            'currentCourse'
        );

    const results =
        document.getElementById(
            'results'
        );

    results.innerHTML = '';

    const parsed =
        courseSearchParseCourseCode(
            input
        );

    if (!parsed) {

        status.innerHTML =
            '<div class="error">' +
            'Invalid course format. ' +
            'Example: BIOL186' +
            '</div>';

        return;
    }

    status.innerHTML =
        '<div>Loading...</div>';

    currentCourse.innerHTML =
        `${parsed.subject}${parsed.courseNumber}`;

    try {

        const septJson =
            await courseSearchLoadTermData(
                parsed.subject,
                '202609'
            );

        const janJson =
            await courseSearchLoadTermData(
                parsed.subject,
                '202701'
            );

        const allSections = [
            ...(septJson?.data || []),
            ...(janJson?.data || [])
        ];

        const matches =
            allSections.filter(
                section =>

                    section.courseNumber ===
                    parsed.courseNumber
            );

        matches.sort(
            courseSearchSortSections
        );

        status.innerHTML =

            `<div class="success">` +

            `Found ${matches.length} sections` +

            `</div>`;

        if (matches.length === 0) {

            results.innerHTML =
                '<p>No matching sections found.</p>';

            return;
        }

        let html = `

            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                "
            >

                <thead>

                    <tr>

                        <th
                            style="
                                border-bottom:1px solid #ccc;
                                text-align:left;
                                padding:8px;
                            "
                        >
                            Term
                        </th>

                        <th
                            style="
                                border-bottom:1px solid #ccc;
                                text-align:left;
                                padding:8px;
                            "
                        >
                            CRN
                        </th>

                        <th
                            style="
                                border-bottom:1px solid #ccc;
                                text-align:left;
                                padding:8px;
                            "
                        >
                            Delivery
                        </th>

                        <th
                            style="
                                border-bottom:1px solid #ccc;
                                text-align:left;
                                padding:8px;
                            "
                        >
                            Type
                        </th>

                        <th
                            style="
                                border-bottom:1px solid #ccc;
                                text-align:left;
                                padding:8px;
                            "
                        >
                            Days + Times
                        </th>

                    </tr>

                </thead>

                <tbody>

        `;

        for (
            const section of
            matches
        ) {

            html += `

                <tr>

                    <td
                        style="
                            padding:8px;
                            border-bottom:1px solid #eee;
                        "
                    >

                        ${
                            COURSE_SEARCH_TERM_LABELS[
                                section.term
                            ]
                        }

                    </td>

                    <td
                        style="
                            padding:8px;
                            border-bottom:1px solid #eee;
                        "
                    >

                        <strong>

                            ${
                                section.courseReferenceNumber
                            }

                        </strong>

                    </td>

                    <td
                        style="
                            padding:8px;
                            border-bottom:1px solid #eee;
                        "
                    >

                        ${
                            section
                                .instructionalMethodDescription
                        }

                    </td>

                    <td
                        style="
                            padding:8px;
                            border-bottom:1px solid #eee;
                        "
                    >

                        ${
                            section
                                .scheduleTypeDescription
                        }

                    </td>

                    <td
                        style="
                            padding:8px;
                            border-bottom:1px solid #eee;
                        "
                    >

                        ${
                            courseSearchBuildMeetingString(
                                section
                            )
                        }

                    </td>

                </tr>

            `;
        }

        html += `

                </tbody>

            </table>

        `;

        results.innerHTML = html;
    }
    catch (err) {

        console.error(err);

        status.innerHTML =

            '<div class="error">' +

            'Failed to load course data.' +

            '</div>';
    }
}

document
    .getElementById(
        'searchButton'
    )
    .addEventListener(
        'click',
        courseSearchRun
    );

