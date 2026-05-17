import { chromium } from "playwright";
import fs from "fs";

const subject = process.argv[2];
const description = process.argv[3];
const term = process.argv[4];

if (!subject || !description || !term) {

    console.log("Usage:");
    console.log(
        'node scripts/fetch-subject-courses.js "PSYC" "Psychology" 202701'
    );

    process.exit(1);
}

async function run() {

    const browser = await chromium.launch({
        headless: true
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

    await page.keyboard.press("Escape");

    await page.waitForTimeout(1000);

    console.log("Clicking Continue...");

    await page.locator("#term-go").click();

    console.log("Waiting for search page...");

    await page.waitForTimeout(5000);

    console.log("Preparing search interception...");

    const responsePromise =
        page.waitForResponse(response =>
            response.url().includes(
                "searchResults/searchResults"
            )
        );

    console.log("Selecting subject...");

    await page.locator(
        "#s2id_autogen1"
    ).click();

    await page.waitForTimeout(1000);

    await page.keyboard.type(description);

    await page.waitForTimeout(2000);

    console.log("Selecting:");
    console.log(description);

    await page.locator(
        `#${subject}`
    ).click();

    await page.waitForTimeout(1000);

    console.log("Clicking Search...");

    await page.locator(
        "#search-go"
    ).click();

    console.log("Waiting for first response...");

    const firstResponse =
        await responsePromise;

    const url =
        new URL(firstResponse.url());

    url.searchParams.set(
        "pageOffset",
        "0"
    );

    url.searchParams.set(
        "pageMaxSize",
        "500"
    );

    console.log("Expanded URL:");
    console.log(url.toString());

    console.log("Fetching all sections...");

    const response =
        await page.request.get(
            url.toString()
        );

    const json =
        await response.json();

    console.log("Total sections:");
    console.log(json.totalCount);

    fs.writeFileSync(
        `data/${subject}-${term}.json`,
        JSON.stringify(json, null, 2)
    );

    console.log("Saved:");
    console.log(
        `data/${subject}-${term}.json`
    );

    await browser.close();
}

run().catch(err => {

    console.log("FAILED");
    console.log(err);
});

