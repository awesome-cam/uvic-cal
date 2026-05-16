import axios from "axios";
import fs from "fs";

const subject = process.argv[2];
const course = process.argv[3];
const term = process.argv[4];

if (!subject || !course || !term) {
    console.log("Usage:");
    console.log("node scripts/fetch-course.js BIOL 186 202601");
    process.exit(1);
}

async function run() {

    console.log("Creating session...");

    // Step 1: create session
    const sessionResponse = await axios.get(
        "https://banner.uvic.ca/StudentRegistrationSsb/ssb/classSearch/classSearch"
    );

    const cookies = sessionResponse.headers["set-cookie"];
    const html = sessionResponse.data;

    const tokenMatch = html.match(
        /meta name="synchronizerToken" content="([^"]+)"/
    );

    const synchronizerToken = tokenMatch
        ? tokenMatch[1]
        : "";

    console.log("Synchronizer token:");
    console.log(synchronizerToken);

    console.log("Session created.");
    const uniqueSessionId =
        "node" + Date.now();

    console.log("Unique session ID:");
    console.log(uniqueSessionId);

    // Step 2: actual course search
    console.log("Searching for course...");

    const searchResponse = await axios.post(
        "https://banner.uvic.ca/StudentRegistrationSsb/ssb/searchResults/searchResults",
        {},
        {
            headers: {
                Cookie: cookies.join(";"),
                "X-Requested-With": "XMLHttpRequest",
                "X-Synchronizer-Token": synchronizerToken,
                "Content-Type": "application/json"
            },
            params: {
                txt_subject: subject,
                txt_courseNumber: course,
                txt_instructionalMethod: "F2F",
                txt_term: term,
                uniqueSessionId: uniqueSessionId,
                startDatepicker: "",
                endDatepicker: "",
                pageOffset: 0,
                pageMaxSize: 10,
                sortColumn: "subjectDescription",
                sortDirection: "asc"
            }
        }
    );

    console.log("SUCCESS");
    console.log("");

	const outputFile =
        `data/${subject}${course}-${term}.json`;

	fs.writeFileSync(
        outputFile,
        JSON.stringify(searchResponse.data, null, 2)
    );

console.log("Saved results to:");
console.log(outputFile);


}

run().catch(err => {

    console.log("FAILED");

    if (err.response) {
        console.log(err.response.status);
        console.log(err.response.data);
    }
    else {
        console.log(err.message);
    }
});
