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

function createSoftPreferencesHtml() {

    return `

        <div
            style="
                margin-top:20px;
                display:flex;
                flex-direction:column;
                gap:12px;
                max-width:600px;
            "
        >

            <div>

                <label>

                    Schedule Personality:

                </label>

            </div>

            <div>

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

        hardConstraints: {

            availability: {}
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


function getRequiredSinglePickGroups(
    request
) {

    return request.groups.filter(
        group =>

            group.pick === 1

            &&

            group.courses.length === 1
    );
}

function getLectureAnchors(
    bundles,
    request
) {

    const requiredGroups =
        getRequiredSinglePickGroups(
            request
        );

    const anchors = [];

    for (
        const group of
        requiredGroups
    ) {

        const courseCode =
            group.courses[0].code;

        /*
            Find lecture bundles
            for this course
        */

        const matchingBundles =
            bundles.filter(
                bundle =>

                    bundle.course ===
                    courseCode
            );

        /*
            Group by term
        */

        const byTerm = {

            '202609': [],
            '202701': []
        };

        for (
            const bundle of
            matchingBundles
        ) {

            byTerm[
                bundle.term
            ].push(
                bundle
            );
        }

        /*
            Choose up to 5
            while trying to
            preserve term diversity
        */

        const selected = [];

        /*
            First:
            try one per term
        */

        for (
            const term of
            [
                '202609',
                '202701'
            ]
        ) {

            if (
                byTerm[term].length > 0
            ) {

                selected.push(
                    byTerm[term][0]
                );
            }
        }

        /*
            Fill remaining slots
        */

        const remaining = [

            ...byTerm['202609']
                .slice(1),

            ...byTerm['202701']
                .slice(1)
        ];

        for (
            const bundle of
            remaining
        ) {

            if (
                selected.length >= 5
            ) {

                break;
            }

            selected.push(
                bundle
            );
        }

        /*
            Store anchors
        */

        for (
            const bundle of
            selected
        ) {

            anchors.push({

                course:
                    courseCode,

                bundle
            });
        }
    }

    return anchors;
}

async function solveSingleForcedSchedule(
    request,
    bundles,
    forcedBundleId
) {



    const glpkInstance =
        await glpk();

    const groupModels =
        buildGroupModels(
            request,
            bundles
        );

    const {
        conflicts
    } = buildIlpModelData(
        bundles
    );

    const vars =
        bundles.map(
            bundle =>

                `x_${bundle.bundleId}`
        );

    const objectiveVars =
        [];

    for (
        const group of
        groupModels
    ) {

        for (
            const entry of
            group.eligibleBundles
        ) {

            objectiveVars.push({

                name:
                    `x_${entry.bundle.bundleId}`,

                coef:
                    entry.priority
            });
        }
    }

    const subjectTo = [];

    /*
        Conflict constraints
    */

    for (
        const bundle of
        bundles
    ) {

        const conflictsWith =
            conflicts.get(
                bundle.bundleId
            );

        for (
            const otherId of
            conflictsWith
        ) {

            if (
                bundle.bundleId >
                otherId
            ) {

                continue;
            }

            subjectTo.push({

                name:

                    `conflict_${bundle.bundleId}_${otherId}`,

                vars: [

                    {
                        name:
                            `x_${bundle.bundleId}`,

                        coef: 1
                    },

                    {
                        name:
                            `x_${otherId}`,

                        coef: 1
                    }
                ],

                bnds: {

                    type:
                        glpkInstance.GLP_UP,

                    ub: 1,

                    lb: 0
                }
            });
        }
    }

    /*
        Group constraints
    */

    for (
        const group of
        groupModels
    ) {

        subjectTo.push({

            name:
                `group_${group.groupId}`,

            vars:

                group.eligibleBundles.map(
                    entry => ({

                        name:

                            `x_${entry.bundle.bundleId}`,

                        coef: 1
                    })
                ),

            bnds: {

                type:
                    glpkInstance.GLP_FX,

                ub:
                    group.pick,

                lb:
                    group.pick
            }
        });
    }

    /*
        Forced anchor constraint
    */

    subjectTo.push({

        name:
            `forced_${forcedBundleId}`,

        vars: [

            {
                name:
                    `x_${forcedBundleId}`,

                coef: 1
            }
        ],

        bnds: {

            type:
                glpkInstance.GLP_FX,

            ub: 1,

            lb: 1
        }
    });

    const lp = {

        name:
            'uvic_schedule',

        objective: {

            direction:
                glpkInstance.GLP_MAX,

            name:
                'obj',

            vars:
                objectiveVars
        },

        subjectTo,

        binaries: vars
    };

    const result =
        glpkInstance.solve(
            lp
        );

    if (
        !result.result.vars
    ) {

        return null;
    }

    const selectedBundles =
        [];

    for (
        const bundle of
        bundles
    ) {

        const varName =
            `x_${bundle.bundleId}`;

        if (

            result.result.vars[
                varName
            ] === 1
        ) {

            selectedBundles.push(
                bundle
            );
        }
    }

    return {

        bundles:
            selectedBundles
    };
}

async function generateCandidateSchedules(
    request,
    bundles
) {


    const anchors =
        getLectureAnchors(
            bundles,
            request
        );

    console.log(
        'ANCHORS',
        anchors
    );

    const schedules = [];

    const seen =
        new Set();

    for (
        const anchor of
        anchors
    ) {

        console.log(
            'SOLVING ANCHOR',
            anchor
        );

        const result =
            await solveSingleForcedSchedule(

                request,

                bundles,

                anchor.bundle.bundleId
            );

        if (!result) {

            console.log(
                'NO SOLUTION'
            );

            continue;
        }

        /*
            Deduplicate
        */

        const signature =

            result.bundles

            .map(
                bundle =>
                    bundle.bundleId
            )

            .sort()

            .join('|');

        if (
            seen.has(
                signature
            )
        ) {

            continue;
        }

        seen.add(
            signature
        );

        schedules.push({

            anchor,

            bundles:
                result.bundles
        });
    }

    return schedules;
}

