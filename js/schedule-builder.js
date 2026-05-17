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

const TIME_BLOCKS = [
    'Morning',
    'Afternoon',
    'Evening'
];

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

function createAvailabilityTable() {

    const headerCells =
        DAYS.map(day => `
            <th>${day}</th>
        `).join('');

    const rows =
        TIME_BLOCKS.map(timeBlock => {

            const cells =
                DAYS.map(day => `

                    <td>

                        <input
                            type="checkbox"
                            checked
                            data-day="${day}"
                            data-time-block="${timeBlock}"
                        />

                    </td>

                `).join('');

            return `

                <tr>

                    <td>
                        ${timeBlock}
                    </td>

                    ${cells}

                </tr>

            `;
        }).join('');

    return `

        <table class="availability-table">

            <tr>

                <th></th>

                ${headerCells}

            </tr>

            ${rows}

        </table>

    `;
}

function createGroupHtml(
    groupNumber
) {

    return `

        <div class="requirement-group">

            <div class="group-header">

                <strong>

                    Course Group ${groupNumber}

                </strong>

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
            Days Available
        </h3>

        ${createAvailabilityTable()}

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

            const group = {

                pick: 1,

                courses: []
            };

            const courseEntries =
                groupEl.querySelectorAll(
                    '.course-entry'
                );

            courseEntries.forEach(
                entry => {

                    const code =
                        entry
                            .querySelector(
                                'input'
                            )
                            .value

                            .trim()
                            .toUpperCase();

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

function buildRequest() {

    return {

        groups:
            buildGroups(),

        hardConstraints: {},

        softPreferences: {}
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

            console.log(
                'START VALIDATION'
            );

            const request =
                buildRequest();

            const result =
                await validateRequest(
                    request
                );

            console.log(
                'VALIDATION DONE'
            );

            if (
                result.valid
            ) {

                console.log(
                    'START GENERATION'
                );

                const schedules =
                    await generateSchedules(
                        request
                    );

                console.log(
                    'GENERATION DONE'
                );

                console.log(
                    schedules
                );

                output.innerHTML = `

                    <div class="success">

                        Found
                        ${schedules.length}
                        schedules.

                    </div>

                    <pre>

${JSON.stringify(
    schedules
        .slice(0, 1),
    null,
    2
)}

                    </pre>

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

