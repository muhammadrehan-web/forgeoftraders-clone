const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "screenshots");

async function serve(port) {
  const cloneRoot = path.join(ROOT, "clone");
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
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const file = path.join(cloneRoot, urlPath.replace(/^\//, ""));
    if (!file.startsWith(cloneRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("nf");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(port, r));
  return server;
}

async function setupPage(context, url) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.addInitScript(() => {
    try {
      sessionStorage.removeItem("forge.offer.minimised");
      localStorage.removeItem("forge.cookie.consent");
    } catch {}
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2500);
  // accept cookies if shown
  try {
    const btn = page.locator('button:has-text("Accept all")').first();
    if (await btn.isVisible({ timeout: 2000 })) await btn.click();
  } catch {}
  await page.waitForTimeout(1000);
  return { page, errors };
}

async function main() {
  const server = await serve(4173);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const orig = await setupPage(context, "https://forgeoftraders.com/");
  const clone = await setupPage(context, "http://127.0.0.1:4173/");

  console.log("ORIG errors:", orig.errors.slice(0, 15));
  console.log("CLONE errors:", clone.errors.slice(0, 15));

  // Compare key metrics
  const metrics = async (page) =>
    page.evaluate(() => {
      const hero = document.querySelector("img[src*='forge-hero'], picture img");
      const h1 = document.querySelector("h1");
      return {
        scrollHeight: document.documentElement.scrollHeight,
        h1: h1 ? h1.innerText.replace(/\s+/g, " ").trim() : null,
        heroW: hero ? hero.naturalWidth : 0,
        heroH: hero ? hero.clientHeight : 0,
        fonts: [...document.fonts].slice(0, 5).map((f) => f.family + " " + f.status),
      };
    });

  const om = await metrics(orig.page);
  const cm = await metrics(clone.page);
  console.log("ORIG metrics", om);
  console.log("CLONE metrics", cm);

  // Side-by-side screenshots at matching scroll positions
  const positions = [0, 1200, 2500, 4000, 6000, 8500];
  for (const y of positions) {
    await orig.page.evaluate((yy) => window.scrollTo(0, yy), y);
    await clone.page.evaluate((yy) => window.scrollTo(0, yy), y);
    await orig.page.waitForTimeout(400);
    await clone.page.waitForTimeout(400);
    await orig.page.screenshot({ path: path.join(OUT, `cmp-orig-${y}.png`) });
    await clone.page.screenshot({ path: path.join(OUT, `cmp-clone-${y}.png`) });
  }

  // Interaction smoke: open HOW IT WORKS dropdown
  try {
    await clone.page.locator('button:has-text("HOW IT WORKS"), a:has-text("HOW IT WORKS"), summary:has-text("HOW IT WORKS")').first().hover();
    await clone.page.waitForTimeout(600);
    await clone.page.screenshot({ path: path.join(OUT, "clone-nav-hover.png") });
    await orig.page.locator('button:has-text("HOW IT WORKS"), a:has-text("HOW IT WORKS"), summary:has-text("HOW IT WORKS")').first().hover();
    await orig.page.waitForTimeout(600);
    await orig.page.screenshot({ path: path.join(OUT, "orig-nav-hover.png") });
  } catch (e) {
    console.log("nav hover skip", e.message);
  }

  await browser.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
