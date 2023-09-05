import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { IMALUUM_LOGIN_PAGE } from "../../constants";
import { IMALUUM_HOME_PAGE } from "../../constants";
import { writeFileSync } from "fs";
// import Chromium from "chrome-aws-lambda";
// import { chromium } from "playwright";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  console.log("Launching browser");

  const browser = await puppeteer.launch({
    headless: true, // Set to true for production means:takbukak browser
    args: ["--no-sandbox"],
  });

  // const browser = await chromium.puppeteer.launch({
  //   args: chromium.args,
  //   defaultViewport: chromium.defaultViewport,
  //   executablePath: await chromium.executablePath,
  //   headless: chromium.headless,
  //   ignoreHTTPSErrors: true,
  // });

  // const browser = await puppeteer.connect({
  //   browserWSEndpoint: `wss://chrome.browserless.io?token=7a2f92d0-ef85-42e1-b577-c8750cedfc80`,
  // });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);

  try {
    console.log("Opening page");
    await page.goto(IMALUUM_LOGIN_PAGE);

    console.log("Typing username");
    // await page.type("input#username", username);
    await page.$eval(
      "input#username",
      (el, username) => (el.value = username),
      username
    );
    // await new Promise((r) => setTimeout(r, 100));
    console.log("Typing password");
    // await page.type("input#password", password);
    await page.$eval(
      "input#password",
      (el, password) => (el.value = password),
      password
    );
    console.log("Clicking submit");
    // await page.waitForSelector("input.btn");
    await new Promise((r) => setTimeout(r, 100));
    // await page.click("input.btn");
    // await page.$eval("input.btn", (el) => el.click());
    const [response] = await Promise.all([
      page.waitForNavigation({
        waitUntil: "networkidle0",
      }),
      page.$eval("#fm1 input.btn-submit", (node) => {
        // @ts-ignore
        node.disabled = false;
        // @ts-ignore
        node.click();
      }),
    ]);

    if (response.status() == 401) {
      const invalidStr = await page?.$eval(
        "form#fm1 div.alert.alert-danger span",
        (elem) => elem.textContent
      );

      if (invalidStr == "Invalid credentials.")
        throw new Error("Invalid credentials");
      else throw new Error("Unable to proceed from login page");
    }

    // await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("Opening home page");
    const currentUrl = page.url();

    if (currentUrl !== IMALUUM_HOME_PAGE) {
      console.log("test");
      throw new Error(
        `Wrong page. Expected ${IMALUUM_HOME_PAGE} but got ${currentUrl}.`
      );
    }

    console.log("Getting cookies");
    const cookies = (await page.cookies())?.filter((value) => {
      if (value.name == "XSRF-TOKEN" || value.name == "laravel_session")
        return value;
      else if (value.name == "MOD_AUTH_CAS") {
        value.expires = 10000000000;
        value.session = false;
        value.secure = false;
        return value;
      }
    });

    // Create a JSON file with the cookies data
    writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));

    // console.log("Waiting for page to load");
    // await page.waitForNavigation({ waitUntil: "networkidle2" });

    // console.log("Getting cookies");
    // await new Promise((r) => setTimeout(r, 200));
    // const cookies = await page.cookies();
    // console.log("done");

    return NextResponse.json({ cookies });
  } catch (error) {
    // Handle any errors here
    console.error("Error:", error);
    return NextResponse.error();
  } finally {
    await browser.close(); // Close the browser when done
  }
}
