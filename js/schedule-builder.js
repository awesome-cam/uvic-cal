const scheduleBuilderRoot =
    document.getElementById(
        'scheduleBuilderRoot'
    );

let groupCount = 1;

const DAYS = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
];

const DEFAULT_EARLIEST =
    8 * 60;

const DEFAULT_LATEST =
    22 * 60;

function normalizeCourseCode(
    input
) {

    return input
        .toUpperCase()
        .replace(/\s+/g, '')
        .trim();
}

function minutesToLabel(
    minutes
) {

    const hours24 =
        Math.floor(
            minutes / 60
        );

    const mins =
        minutes % 60;

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

        `${hours12}:` +

        mins
            .toString()
            .padStart(2, '0') +

        ` ${suffix}`
    );
}

function createTimeOptions(
    selectedMinutes
) {

    let html = '';

    for (
        let minutes = 360;
        minutes <= 1320;
        minutes += 30
    ) {

        html += `

            <option
                value="${minutes}"

                ${
                    minutes ===
                    selectedMinutes

                        ? 'selected'
                        : ''
                }
            >

                ${minutesToLabel(
                    minutes
                )}

            </option>

        `;
    }

    return html;
}

function createCourseHtml() {

    return `

        <div class="course-entry">

            <input
                type="text"
                placeholder="CHEM102"
            />

            <div class="course-preferences">

                <div>

                    Semester:

                    <select class="semester-select">

                        <option>Either</option>
                        <option>Sept</option>
                        <option>Jan</option>

                    </select>

                </div>

                <div>

                    Priority (5 = highest):

                    <select class="priority-select">

                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option selected>5</option>

                    </select>

                </div>

            </div>

        </div>

    `;
}

function createAvailabilityRows() {

    return DAYS.map(day => `

        <div
            class="availability-row"
            style="
                display:flex;
                align-items:center;
                gap:12px;
                margin-bottom:10px;
                flex-wrap:wrap;
            "
        >

            <label
                style="
                    width:60px;
                    display:flex;
                    align-items:center;
                    gap:6px;
                "
            >

                <input
                    type="checkbox"
                    class="day-enabled-checkbox"
                    data-day="${day}"
                    checked
                />

                ${day}

            </label>

            <div>

                Earliest:

                <select
                    class="earliest-select"
                    data-day="${day}"
                >

                    ${createTimeOptions(
                        DEFAULT_EARLIEST
                    )}

                </select>

            </div>

            <div>

                Latest:

                <select
                    class="latest-select"
                    data-day="${day}"
                >

                    ${createTimeOptions(
                        DEFAULT_LATEST
                    )}

                </select>

            </div>

        </div>

    `).join('');
}

function createSoftPreferencesHtml() {

    return `

        <div
            style="
                margin-top:20px;
                display:flex;
                flex-direction:column;
                gap:20px;
                max-width:600px;
            "
        >

            <div>

                <label>

                    Delivery Preference:

                </label>

                <div style="margin-top:8px;">

                    <select
                        id="deliveryMode"
                        style="
                            width:100%;
                            padding:8px;
                        "
                    >

                        <option
                            value="face-to-face"
                            selected
                        >

                            Face-to-face only

                        </option>

                        <option
                            value="allow-online"
                        >

                            Allow mixed / online

                        </option>

                        <option
                            value="online-only"
                        >

                            Online only

                        </option>

                    </select>

                </div>

            </div>

            <div>

                <label>

                    Schedule Personality:

                </label>

                <div style="margin-top:8px;">

                    <select
                        id="schedulePersonality"
                        style="
                            width:100%;
                            padding:8px;
                        "
                    >

                        <option value="balanced" selected>

                            Balanced —
                            Good overall schedules
                            with decent compactness
                            and strong course choices

                        </option>

                        <option value="course-first">

                            Course-First —
                            Maximizes preferred
                            courses even if the
                            schedule shape is worse

                        </option>

                        <option value="compact">

                            Compact —
                            Strongly prefers fewer
                            campus days while still
                            keeping reasonable flow

                        </option>

                        <option value="relaxed">

                            Relaxed —
                            Prefers smoother days
                            with fewer exhausting
                            idle gaps

                        </option>

                        <option value="ultra-compact">

                            Ultra-Compact —
                            Aggressively minimizes
                            days on campus;
                            ideal for commuters

                        </option>

                        <option value="low-stress">

                            Low-Stress —
                            Prioritizes comfortable
                            pacing and avoids long
                            dead periods

                        </option>

                    </select>

                </div>

            </div>

        </div>

    `;
}

function createPickOptions() {

    let html = '';

    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        html += `

            <option value="${i}">

                ${i}

            </option>

        `;
    }

    return html;
}

function createGroupHtml(
    groupNumber
) {

    return `

        <div class="requirement-group">

            <div
                class="group-header"
                style="
                    display:flex;
                    align-items:center;
                    gap:16px;
                    margin-bottom:10px;
                    flex-wrap:wrap;
                "
            >

                <strong>

                    Course Group ${groupNumber}

                </strong>

                <div>

                    Pick:

                    <select class="pick-count-select">

                        ${createPickOptions()}

                    </select>

                </div>

            </div>

            <div class="courses-container">

                ${createCourseHtml()}

            </div>

            <button class="add-or-course-button">

                + Add OR Course

            </button>

        </div>

    `;
}

scheduleBuilderRoot.innerHTML = `

    <div class="builder-section">

        <h3>
            Day Availability
        </h3>

        <div
            style="
                display:flex;
                flex-direction:column;
                gap:8px;
                margin-top:20px;
                margin-bottom:30px;
            "
        >

            ${createAvailabilityRows()}

        </div>

        ${createSoftPreferencesHtml()}

    </div>

    <div class="builder-section">

        <h3>
            Course Groups
        </h3>

        <div id="groupsContainer">

            ${createGroupHtml(1)}

        </div>

        <button
            class="add-group-button"
            id="addGroupButton"
        >

            + Add Course Group

        </button>

    </div>

    <div class="builder-section">

        <button
            class="generate-button"
            id="generateButton"
        >

            Generate Schedules

        </button>

        <div
            id="validationOutput"
            style="margin-top:20px;"
        ></div>

    </div>

`;

document
    .getElementById(
        'addGroupButton'
    )
    .addEventListener(
        'click',
        () => {

            groupCount++;

            const container =
                document.getElementById(
                    'groupsContainer'
                );

            container.insertAdjacentHTML(
                'beforeend',

                createGroupHtml(
                    groupCount
                )
            );

            attachOrCourseButtons();
        }
    );

function attachOrCourseButtons() {

    const buttons =
        document.querySelectorAll(
            '.add-or-course-button'
        );

    buttons.forEach(button => {

        if (
            button.dataset
                .listenerAttached
        ) {

            return;
        }

        button.dataset
            .listenerAttached =
            'true';

        button.addEventListener(
            'click',
            () => {

                const group =
                    button.closest(
                        '.requirement-group'
                    );

                const coursesContainer =
                    group.querySelector(
                        '.courses-container'
                    );

                coursesContainer.insertAdjacentHTML(
                    'beforeend',

                    `

                    <div class="or-divider">

                        OR

                    </div>

                    ${createCourseHtml()}

                    `
                );
            }
        );
    });
}

function buildGroups() {

    const groups = [];

    const groupElements =
        document.querySelectorAll(
            '.requirement-group'
        );

    groupElements.forEach(
        groupEl => {

            const pick = parseInt(

                groupEl
                    .querySelector(
                        '.pick-count-select'
                    )
                    .value
            );

            const group = {

                pick,

                courses: []
            };

            const courseEntries =
                groupEl.querySelectorAll(
                    '.course-entry'
                );

            courseEntries.forEach(
                entry => {

                    const code =
                        normalizeCourseCode(

                            entry
                                .querySelector(
                                    'input'
                                )
                                .value
                        );

                    if (!code) {
                        return;
                    }

                    const semester =
                        entry
                            .querySelector(
                                '.semester-select'
                            )
                            .value;

                    const priority =
                        parseInt(

                            entry
                                .querySelector(
                                    '.priority-select'
                                )
                                .value
                        );

                    group.courses.push({

                        code,

                        semester,

                        priority
                    });
                }
            );

            groups.push(group);
        }
    );

    return groups;
}

function buildDayAvailability() {

    const availability = {};

    for (
        const day of DAYS
    ) {

        const enabled =
            document.querySelector(

                `.day-enabled-checkbox[data-day="${day}"]`

            ).checked;

        const earliestStart =
            parseInt(

                document.querySelector(

                    `.earliest-select[data-day="${day}"]`

                ).value
            );

        const latestEnd =
            parseInt(

                document.querySelector(

                    `.latest-select[data-day="${day}"]`

                ).value
            );

        availability[day] = {

            enabled,

            earliestStart,

            latestEnd
        };
    }

    return availability;
}

function buildRequest() {

    return {

        groups:
            buildGroups(),

        hardConstraints: {

            dayAvailability:
                buildDayAvailability(),

            deliveryMode:
                document.getElementById(
                    'deliveryMode'
                ).value
        },

        softPreferences: {

            personality:
                document.getElementById(
                    'schedulePersonality'
                ).value
        }
    };
}

attachOrCourseButtons();

document
    .getElementById(
        'generateButton'
    )

    .addEventListener(
        'click',

        async () => {

            const output =
                document.getElementById(
                    'validationOutput'
                );

            output.innerHTML = `

                <div>

                    Generating schedules...

                </div>

            `;

            const request =
                buildRequest();

            console.log(
                'FINAL REQUEST',
                request
            );

            const result =
                await validateRequest(
                    request
                );

            if (
                result.valid
            ) {

                const schedules =
                    await generateSchedules(
                        request
                    );

                output.innerHTML = `

                    <div class="success">

                        Found
                        ${schedules.length}
                        schedules.

                    </div>

                    ${renderSchedules(
                        schedules
                    )}

                `;
            }
            else {

                output.innerHTML = `

                    <div class="error">

                        ${result.errors.join('<br>')}

                    </div>

                `;
            }
        }
    );

