// Renders og.png (the link preview) from banner.html. Needs Playwright: node scripts/banner.cjs
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const root = path.join(__dirname, "..");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await page.goto("file://" + path.join(root, "banner.html"));
  await page.evaluate(() => document.querySelector('[data-value="2"]').click());
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(root, "og.png") });
  await browser.close();
  console.log("wrote og.png");
})();
