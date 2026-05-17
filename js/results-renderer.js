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

function renderMeeting(
    meeting
) {

    return `

        ${meeting.day}

        ${formatMinutes(
            meeting.startMinutes
        )}

        -

        ${formatMinutes(
            meeting.endMinutes
        )}

    `;
}

function renderSection(
    section
) {

    const meetingsText =
        section.meetings
            .map(renderMeeting)
            .join('<br>');

    return `

        <div class="rendered-section">

            <div>

                <strong>
                    ${section.course}
                </strong>

            </div>

            <div>
                CRN:
                ${section.crn}
            </div>

            <div>
                ${section.type}
                ${section.sequence}
            </div>

            <div>

                ${meetingsText}

            </div>

        </div>

    `;
}

function renderSchedules(
    schedules
) {

    const MAX_DISPLAYED = 5;

    if (
        schedules.length === 0
    ) {

        return `

            <div class="error">

                No valid schedules found.

            </div>

        `;
    }

    return schedules

        .slice(
            0,
            MAX_DISPLAYED
        )

        .map(

            (
                schedule,
                index
            ) => `

                <div class="schedule-card">

                    <h3>
                        Schedule ${index + 1}
                    </h3>

                    ${schedule
                        .map(renderSection)
                        .join('')}

                </div>

            `
        )

        .join('');
}



