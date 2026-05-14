import axios from "axios";

const subject = process.argv[2];
const course = process.argv[3];
const term = process.argv[4];

if (!subject || !course || !term) {
    console.log("Usage:");
    console.log("node scripts/fetch-course.js BIOL 186 202601");
    process.exit(1);
}

console.log("Searching UVic...");
console.log(`Subject: ${subject}`);
console.log(`Course: ${course}`);
console.log(`Term: ${term}`);

async function testSearch() {
    try {
        const response = await axios.get(
            "https://banner.uvic.ca/StudentRegistrationSsb/ssb/classSearch/getTerms"
        );

        console.log("SUCCESS");
        console.log("Received data from UVic");

        console.log(response.data);
    }
    catch (err) {
        console.error("FAILED");

        if (err.response) {
            console.error(err.response.status);
            console.error(err.response.data);
        }
        else {
            console.error(err.message);
        }
    }
}

testSearch();
