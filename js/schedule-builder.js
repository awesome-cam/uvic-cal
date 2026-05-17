const scheduleBuilderRoot =
    document.getElementById(
        'scheduleBuilderRoot'
    );

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

                <option>Less</option>
                <option selected>Balanced</option>
                <option>More</option>

            </select>

        </div>

        <div class="preference-row">

            <label>
                Breaks during the day:
            </label>

            <select>

                <option>Less</option>
                <option selected>Balanced</option>
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

        <h3>Requirement Groups</h3>

        <div class="requirement-group">

            <div class="group-header">

                <strong>
                    Requirement Group 1
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

            <div class="course-entry">

                <input
                    type="text"
                    placeholder="CHEM101"
                />

                <div class="course-preferences">

                    Semester:

                    <select>

                        <option>Either</option>
                        <option>Sept</option>
                        <option>Jan</option>

                    </select>

                    Desire:

                    <select>

                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option selected>5</option>

                    </select>

                </div>

            </div>

            <div class="or-divider">
                OR
            </div>

            <div class="course-entry">

                <input
                    type="text"
                    placeholder="CHEM100"
                />

                <div class="course-preferences">

                    Semester:

                    <select>

                        <option>Either</option>
                        <option>Sept</option>
                        <option>Jan</option>

                    </select>

                    Desire:

                    <select>

                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option selected>5</option>

                    </select>

                </div>

            </div>

            <button>
                + Add OR Course
            </button>

        </div>

        <button class="add-group-button">
            + Add Requirement Group
        </button>

    </div>

    <div class="builder-section">

        <button class="generate-button">
            Generate Schedules
        </button>

    </div>

`;

