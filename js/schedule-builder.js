const scheduleBuilderRoot =
    document.getElementById(
        'scheduleBuilderRoot'
    );

const state = {

    groups: [
        createEmptyGroup()
    ]
};

function createEmptyGroup() {

    return {

        pick: 1,

        courses: [
            createEmptyCourse()
        ]
    };
}

function createEmptyCourse() {

    return {

        code: '',
        semester: 'Either',
        desire: 5
    };
}

function parseCourseCode(code) {

    const cleaned =
        code.trim().toUpperCase();

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

async function loadTermData(
    subject,
    term
) {

    try {

        const response =
            await fetch(
                `data/${subject}-${term}.json`
            );

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }
    catch {

        return null;
    }
}

function render() {

    scheduleBuilderRoot.innerHTML = `

        <div class="builder-section">

            <h3>Days Available</h3>

            <table class="availability-table">

                <tr>
                    <th></th>
                    <th>Sun</th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                </tr>

                ${buildAvailabilityRow('Morning')}
                ${buildAvailabilityRow('Afternoon')}
                ${buildAvailabilityRow('Evening')}

            </table>

        </div>

        <div class="builder-section">

            <h3>General Preferences</h3>

            <div class="preference-row">

                <label>
                    Number of days:
                </label>

                <select>

                    <option selected>
                        Less
                    </option>

                    <option>
                        Balanced
                    </option>

                    <option>
                        More
                    </option>

                </select>

            </div>

            <div class="preference-row">

                <label>
                    Breaks during the day:
                </label>

                <select>

                    <option selected>
                        Less
                    </option>

                    <option>
                        Balanced
                    </option>

                    <option>
                        More
                    </option>

                </select>

            </div>

            <div class="preference-row">

                <label>
                    Face-to-face lectures:
                </label>

                <select>

                    <option>All</option>
                    <option>Most</option>
                    <option>Some</option>
                    <option>Less</option>
                    <option>None</option>

                </select>

            </div>

        </div>

        <div class="builder-section">

            <h3>Course Groups</h3>

            ${state.groups
                .map((group, groupIndex) =>
                    buildGroupHtml(group, groupIndex)
                )
                .join('')}

            <button
                id="addGroupButton"
                class="add-group-button"
            >
                + Add Course Group
            </button>

        </div>

        <div class="builder-section">

            <button
                id="generateButton"
                class="generate-button"
            >
                Generate Schedules
            </button>

            <div
                id="validationOutput"
                style="margin-top:20px;"
            ></div>

        </div>

    `;

    attachListeners();
}

function buildAvailabilityRow(label) {

    return `

        <tr>

            <td>${label}</td>

            <td><input type="checkbox" checked /></td>
            <td><input type="checkbox" checked /></td>
            <td><input type="checkbox" checked /></td>
            <td><input type="checkbox" checked /></td>
            <td><input type="checkbox" checked /></td>
            <td><input type="checkbox" checked /></td>
            <td><input type="checkbox" checked /></td>

        </tr>

    `;
}

function buildGroupHtml(
    group,
    groupIndex
) {

    return `

        <div class="requirement-group">

            <div class="group-header">

                <strong>
                    Course Group ${groupIndex + 1}
                </strong>

                <div>

                    Pick:

                    <select>

                        <option
                            ${group.pick === 1 ? 'selected' : ''}
                        >
                            1
                        </option>

                        <option
                            ${group.pick === 2 ? 'selected' : ''}
                        >
                            2
                        </option>

                        <option
                            ${group.pick === 3 ? 'selected' : ''}
                        >
                            3
                        </option>

                    </select>

                </div>

            </div>

            ${group.courses
                .map((course, courseIndex) =>
                    buildCourseHtml(
                        course,
                        groupIndex,
                        courseIndex
                    )
                )
                .join('')}

            <button
                class="add-or-course-button"
                data-group="${groupIndex}"
            >
                + Add OR Course
            </button>

        </div>

    `;
}

function buildCourseHtml(
    course,
    groupIndex,
    courseIndex
) {

    return `

        <div class="course-entry">

            <input
                type="text"
                placeholder="CHEM101"

                value="${course.code}"

                class="course-code-input"

                data-group="${groupIndex}"
                data-course="${courseIndex}"
            />

            <div class="course-preferences">

                Semester:

                <select>

                    <option
                        ${course.semester === 'Either' ? 'selected' : ''}
                    >
                        Either
                    </option>

                    <option
                        ${course.semester === 'Sept' ? 'selected' : ''}
                    >
                        Sept
                    </option>

                    <option
                        ${course.semester === 'Jan' ? 'selected' : ''}
                    >
                        Jan
                    </option>

                </select>

                Desire:

                <select>

                    <option
                        ${course.desire == 1 ? 'selected' : ''}
                    >
                        1
                    </option>

                    <option
                        ${course.desire == 2 ? 'selected' : ''}
                    >
                        2
                    </option>

                    <option
                        ${course.desire == 3 ? 'selected' : ''}
                    >
                        3
                    </option>

                    <option
                        ${course.desire == 4 ? 'selected' : ''}
                    >
                        4
                    </option>

                    <option
                        ${course.desire == 5 ? 'selected' : ''}
                    >
                        5
                    </option>

                </select>

            </div>

        </div>

        ${courseIndex < group.courses.length - 1
            ? '<div class="or-divider">OR</div>'
            : ''
        }

    `;
}

function attachListeners() {

    document
        .getElementById(
            'addGroupButton'
        )
        .addEventListener(
            'click',
            () => {

                state.groups.push(
                    createEmptyGroup()
                );

                render();
            }
        );

    document
        .querySelectorAll(
            '.add-or-course-button'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const groupIndex =
                        parseInt(
                            button.dataset.group
                        );

                    state.groups[groupIndex]
                        .courses.push(
                            createEmptyCourse()
                        );

                    render();
                }
            );
        });

    document
        .querySelectorAll(
            '.course-code-input'
        )
        .forEach(input => {

            input.addEventListener(
                'input',
                () => {

                    const group =
                        parseInt(
                            input.dataset.group
                        );

                    const course =
                        parseInt(
                            input.dataset.course
                        );

                    state.groups[group]
                        .courses[course]
                        .code =
                            input.value
                                .toUpperCase();
                }
            );
        });

    document
        .getElementById(
            'generateButton'
        )
        .addEventListener(
            'click',
            validateCourses
        );
}

async function validateCourses() {

    const output =
        document.getElementById(
            'validationOutput'
        );

    output.innerHTML =
        'Checking courses...';

    const failures = [];

    for (const group of state.groups) {

        for (const course of group.courses) {

            const code =
                course.code.trim();

            if (!code) {
                continue;
            }

            const parsed =
                parseCourseCode(code);

            if (!parsed) {

                failures.push(
                    `${code} is invalid format`
                );

                continue;
            }

            const septJson =
                await loadTermData(
                    parsed.subject,
                    '202609'
                );

            const janJson =
                await loadTermData(
                    parsed.subject,
                    '202701'
                );

            const allSections = [

                ...(septJson?.data || []),

                ...(janJson?.data || [])
            ];

            const matches =
                allSections.filter(section =>
                    section.courseNumber ===
                    parsed.courseNumber
                );

            if (matches.length === 0) {

                failures.push(
                    `${code} was not found`
                );
            }
        }
    }

    if (failures.length === 0) {

        output.innerHTML = `

            <div class="success">

                All courses passed sanity check.

            </div>

        `;
    }
    else {

        output.innerHTML = `

            <div class="error">

                ${failures.join('<br>')}

                <br><br>

                Please use the Course Search
                tab to verify course availability.

            </div>

        `;
    }
}

render();



