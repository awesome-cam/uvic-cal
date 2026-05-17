import fs from "fs";
import { execSync } from "child_process";

const term = process.argv[2];

if (!term) {

    console.log("Usage:");
    console.log(
        "node scripts/fetch-all-courses.js 202701"
    );

    process.exit(1);
}

const subjectsFile =
    `data/subjects-${term}.json`;

if (!fs.existsSync(subjectsFile)) {

    console.log("Missing subjects file:");
    console.log(subjectsFile);

    process.exit(1);
}

const subjects =
    JSON.parse(
        fs.readFileSync(subjectsFile)
    );

console.log("Total subjects:");
console.log(subjects.length);

for (const subject of subjects) {

    const code =
        subject.code;

    const description =
        subject.description;

    console.log("");
    console.log("====================");
    console.log("Fetching:");
    console.log(code);
    console.log(description);

    try {

        execSync(
            `node scripts/fetch-subject-courses.js "${code}" "${description}" ${term}`,
            {
                stdio: "inherit"
            }
        );

        console.log("SUCCESS:");
        console.log(code);
    }
    catch (err) {

        console.log("FAILED:");
        console.log(code);
    }
}

console.log("");
console.log("DONE.");
