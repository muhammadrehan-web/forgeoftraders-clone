const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "clone");
const OUT = path.join(__dirname, "screenshots");

async function serve(port) {
  const mime = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".woff2": "font/woff2",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
  };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/") p = "/index.html";
    const f = path.join(ROOT, p.replace(/^\//, ""));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404);
      res.end("nf");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(port, r));
  return server;
}

async function prep(page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.removeItem("forge.offer.minimised");
    } catch {}
  });
  await page.goto(page._targetUrl || page.url(), { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
}

async function main() {
  const server = await serve(4173);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  async function open(url) {
    const page = await context.newPage();
    await page.addInitScript(() => {
      try {
        sessionStorage.removeItem("forge.offer.minimised");
      } catch {}
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(2000);
    try {
      const b = page.locator('button:has-text("Accept all")').first();
      if (await b.isVisible({ timeout: 1500 })) await b.click();
    } catch {}
    await page.waitForTimeout(800);
    return page;
  }

  const clone = await open("http://127.0.0.1:4173/");
  const orig = await open("https://forgeoftraders.com/");

  // Test program size click on clone
  await clone.evaluate(() => window.scrollTo(0, 1100));
  await clone.waitForTimeout(500);
  const sizeBtn = clone.locator('button:has-text("$25k"), [data-size="25000"], .account-size button').first();
  try {
    await sizeBtn.click({ timeout: 3000 });
    await clone.waitForTimeout(400);
  } catch (e) {
    console.log("size click:", e.message);
  }
  await clone.screenshot({ path: path.join(OUT, "clone-programs-interact.png") });

  // Nav dropdown on both
  for (const [name, page] of [
    ["clone", clone],
    ["orig", orig],
  ]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const trigger = page.locator(".nav-item, .navbar, header").locator('text=HOW IT WORKS').first();
    try {
      await trigger.hover({ timeout: 3000 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `${name}-dropdown.png`) });
    } catch (e) {
      console.log(name, "dropdown", e.message);
    }
  }

  // Mobile menu on clone
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle", timeout: 90000 });
  await m.waitForTimeout(1500);
  try {
    const b = m.locator('button:has-text("Accept all")').first();
    if (await b.isVisible({ timeout: 1500 })) await b.click();
  } catch {}
  const burger = m.locator('button.navbar-toggler, button[aria-label*="menu" i], .menu-toggle, header button').last();
  try {
    await burger.click({ timeout: 3000 });
    await m.waitForTimeout(600);
    await m.screenshot({ path: path.join(OUT, "clone-mobile-menu.png") });
  } catch (e) {
    console.log("mobile menu", e.message);
    await m.screenshot({ path: path.join(OUT, "clone-mobile-menu.png") });
  }

  // Final side-by-side heroes
  await orig.evaluate(() => window.scrollTo(0, 0));
  await clone.evaluate(() => window.scrollTo(0, 0));
  await orig.waitForTimeout(400);
  await clone.waitForTimeout(400);
  await orig.screenshot({ path: path.join(OUT, "final-orig.png") });
  await clone.screenshot({ path: path.join(OUT, "final-clone.png") });

  console.log("interaction checks done");
  await browser.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
