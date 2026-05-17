import fs from "fs";
import { execSync } from "child_process";

function runCommand(command) {

    console.log("");
    console.log("==================================");
    console.log(command);
    console.log("==================================");
    console.log("");

    execSync(command, {
        stdio: "inherit"
    });
}

async function run() {

    console.log("Starting full UVic scrape...");

    if (fs.existsSync("data")) {

        console.log("Cleaning old JSON files...");

        const files =
            fs.readdirSync("data");

        for (const file of files) {

            if (file.endsWith(".json")) {

                fs.unlinkSync(
                    `data/${file}`
                );
            }
        }
    }

    runCommand(
        "node scripts/fetch-subjects.js 202701"
    );

    runCommand(
        "node scripts/fetch-subjects.js 202609"
    );

    runCommand(
        "node scripts/fetch-all-courses.js 202701"
    );

    runCommand(
        "node scripts/fetch-all-courses.js 202609"
    );

    console.log("");
    console.log("FULL FETCH COMPLETE.");
}

run().catch(err => {

    console.log("FAILED");
    console.log(err);
});

