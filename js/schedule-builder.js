const scheduleBuilderRoot =
    document.getElementById(
        'scheduleBuilderRoot'
    );

let groupCount = 1;

function createCourseHtml() {

    return `

        <div class="course-entry">

            <input
                type="text"
                placeholder="CHEM102"
            />

            <div class="course-preferences">

                Semester:

                <select>

                    <option>Either</option>
                    <option>Sept</option>
                    <option>Jan</option>

                </select>

               Priority (5 = highest): 

                <select>

                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option selected>5</option>

                </select>

            </div>

        </div>

    `;
}

function createGroupHtml(groupNumber) {

    return `

        <div class="requirement-group">

            <div class="group-header">

                <strong>
                    Course Group ${groupNumber}
                </strong>

                <div>

                    Pick:

                    <select>
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
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

            <tr>

                <td>Morning</td>

                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>

            </tr>

            <tr>

                <td>Afternoon</td>

                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>

            </tr>

            <tr>

                <td>Evening</td>

                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>
                <td><input type="checkbox" checked /></td>

            </tr>

        </table>

    </div>

    <div class="builder-section">

        <h3>General Preferences</h3>

        <div class="preference-row">

            <label>
                Number of days:
            </label>

            <select>

                <option selected>Less</option>
                <option>Balanced</option>
                <option>More</option>

            </select>

        </div>

        <div class="preference-row">

            <label>
                Breaks during the day:
            </label>

            <select>

                <option selected>Less</option>
                <option>Balanced</option>
                <option>More</option>

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
        <p class="course-group-help">

            For most simple usage,
            just pick 1 course per
            course group.

            Course groups allow
            you to add OR logic
            for more complicated
            requests.

        </p>

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
                createGroupHtml(groupCount)
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

        if (button.dataset.listenerAttached) {
            return;
        }

        button.dataset.listenerAttached =
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

function buildRequest() {

    const groups = [];

    const groupElements =
        document.querySelectorAll(
            '.requirement-group'
        );

    groupElements.forEach(groupEl => {

        const group = {

            pick: 1,
            courses: []
        };

        const courseEntries =
            groupEl.querySelectorAll(
                '.course-entry'
            );

        courseEntries.forEach(entry => {

            const code =
                entry.querySelector(
                    'input'
                ).value;

            const selects =
                entry.querySelectorAll(
                    'select'
                );

            const semester =
                selects[0].value;

            const desire =
                parseInt(
                    selects[1].value
                );

            group.courses.push({

                code,
                semester,
                desire
            });
        });

        groups.push(group);
    });

    return {

        groups
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

            const request =
                buildRequest();

            const result =
                await validateRequest(
                    request
                );

            const output =
                document.getElementById(
                    'validationOutput'
                );

            if (result.valid) {
                const schedules =
                    await generateSchedules(
                        request
                    );

                output.innerHTML = `

                    <div class="success">

                        Found
                        ${schedules.length}
                        valid schedules.

                    </div>

                `;
            }
            else {

                output.innerHTML = `

                    <div class="error">

                        ${result.errors.join('<br>')}

                        <br><br>

                        Please use the Course Search tab
                        to verify course availability.

                    </div>

                `;
            }
        }
    );

