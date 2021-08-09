const puppeteer = require("puppeteer-extra");
const fs = require("fs");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

module.exports = async (url) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(10000);

    // Go to page with followers
    await page.goto(`${url}/followers`, {
      waitUntil: "networkidle2",
    });

    // Scroll all the way to the bottom
    await page.evaluate(async () => {
      const sleep = (seconds) => {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      };

      let scrollHeight = 0;
      let nextScrollHeight = 0;
      do {
        scrollHeight = window.document.body.scrollHeight;
        window.scrollBy(0, window.document.body.scrollHeight);
        // wait for the content to lazy load
        await sleep(2);
        nextScrollHeight = window.document.body.scrollHeight;
      } while (scrollHeight !== nextScrollHeight);
    });

    const followers = await page.$x("//ul/li//section//a[@href]");
    const list = [];
    for (const follower of followers) {
      const handle = await follower.getProperty("href");
      list.push(handle._remoteObject.value);
    }

    fs.writeFileSync("followers.json", JSON.stringify(list));
  } catch (error) {
    console.log(error);
  } finally {
    browser && browser.close();
  }
};
