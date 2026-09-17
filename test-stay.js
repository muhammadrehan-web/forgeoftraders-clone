const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);

  const tests = [
    ["LOGIN", "a.account-link"],
    ["START", "a.header-checkout"],
    ["JOIN", "a.join-link"],
    ["GETTING STARTED", 'a[href="./evaluation"]'],
    ["PROGRAMS", 'a[href="./compare-programs"]'],
    ["Contact", 'a[href="./contact"]'],
    ["SEE PROGRAMS", "a.hero-secondary"],
    ["Brand", "a.brand"],
    ["Trustpilot", "a.forged-review-card"],
    ["VIEW ON X", "a.tweet-source"],
  ];

  let failed = 0;
  for (const [name, sel] of tests) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(sel).first().click({ force: true });
    await page.waitForTimeout(400);
    const u = page.url();
    const ok = u.startsWith("http://127.0.0.1:4173");
    console.log(name, ok ? "OK" : "FAIL", u);
    if (!ok) failed++;
  }

  await browser.close();
  if (failed) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
