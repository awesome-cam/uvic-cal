import { chromium } from "playwright";
import fs from "fs";

const term = process.argv[2];

if (!term) {

    console.log("Usage:");
    console.log(
        "node scripts/fetch-subjects.js 202701"
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

    console.log("Preparing for subject request...");

    const responsePromise =
        page.waitForResponse(response =>
            response.url().includes(
                "/get_subject"
            )
        );

    console.log("Opening subject selector...");

    await page.locator(
        "#s2id_autogen1"
    ).click();

    console.log("Waiting for first subject response...");

    const firstResponse =
        await responsePromise;

    const url =
        new URL(firstResponse.url());

    url.searchParams.set(
        "offset",
        "1"
    );

    url.searchParams.set(
        "max",
        "500"
    );

    console.log("Expanded URL:");
    console.log(url.toString());

    console.log("Fetching all subjects...");

    const response =
        await page.request.get(
            url.toString()
        );

    const subjects =
        await response.json();

    console.log("Total subjects:");
    console.log(subjects.length);

    fs.writeFileSync(
        `data/subjects-${term}.json`,
        JSON.stringify(subjects, null, 2)
    );

    console.log("Saved subjects.");

    await browser.close();
}

run().catch(err => {

    console.log("FAILED");
    console.log(err);
});

