import { chromium } from "playwright";
import fs from "fs";

const subject = process.argv[2];
const course = process.argv[3];
const term = process.argv[4];

if (!subject || !course || !term) {

    console.log("Usage:");
    console.log(
        "node scripts/playwright-fetch.js BIOL 186 202701"
    );

    process.exit(1);
}

async function chooseSelect2Option(
    page,
    inputSelector,
    searchText
) {

    console.log("Opening Select2...");

    await page.locator(inputSelector).click();

    await page.waitForTimeout(1000);

    console.log("Typing:");
    console.log(searchText);

    await page.keyboard.type(searchText);

    await page.waitForTimeout(2000);

    console.log("Selecting highlighted dropdown item...");


    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);
}

async function run() {

    const browser = await chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    console.log("Opening UVic registration...");

    await page.goto(
        "https://banner.uvic.ca/StudentRegistrationSsb/ssb/registration/registration",
        {
            waitUntil: "networkidle"
        }
    );

    await page.waitForTimeout(5000);

    console.log("Clicking Search for Classes...");

    const buttons =
        await page.locator(
            "text=Search for Classes"
        ).all();

    await buttons[0].click();

    await page.waitForTimeout(3000);

    console.log("Selecting term...");

    await page.locator(".select2-choice").click();

    await page.waitForTimeout(1000);

    await page.keyboard.type(term);

    await page.waitForTimeout(1000);

    await page.keyboard.press("Enter");

    await page.waitForTimeout(1000);

    console.log("Clicking Continue...");

    await page.getByText("Continue").click();

    console.log("Waiting for search page...");

    await page.waitForTimeout(5000);

    console.log("Selecting subject...");

    await chooseSelect2Option(
        page,
        "#s2id_autogen1",
        subject
    );

    console.log("Entering course number...");

    await page.locator(
        "#txt_courseNumber"
    ).fill(course);

    await page.waitForTimeout(1000);

    console.log("Selecting delivery mode...");

    await chooseSelect2Option(
        page,
        "#s2id_autogen2",
        "Face"
    );

    console.log("Waiting for JSON response...");

    const responsePromise =
        page.waitForResponse(response =>
            response.url().includes(
                "searchResults/searchResults"
            )
        );

    console.log("Clicking Search button...");

    await page.locator("#search-go").click();

    console.log("Waiting for JSON...");

    const response = await responsePromise;

    const json = await response.json();

    console.log("SUCCESS");
    console.log("");

    console.log("Total results:");
    console.log(json.totalCount);

    const outputFile =
        `data/${subject}${course}-${term}.json`;

    fs.writeFileSync(
        outputFile,
        JSON.stringify(json, null, 2)
    );

    console.log("Saved:");
    console.log(outputFile);

    // await browser.close();
}

run().catch(err => {

    console.log("FAILED");
    console.log(err);
});

