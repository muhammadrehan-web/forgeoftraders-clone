const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = __dirname;
const OUT = path.join(ROOT, "screenshots");
fs.mkdirSync(OUT, { recursive: true });

async function serveClone(port) {
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
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
  };
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const file = path.join(cloneRoot, urlPath.replace(/^\//, ""));
    if (!file.startsWith(cloneRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("not found: " + urlPath);
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(port, r));
  return server;
}

async function prepare(page) {
  await page.waitForTimeout(2000);
  try {
    const accept = page.locator('button:has-text("Accept all")').first();
    if (await accept.isVisible({ timeout: 2500 })) await accept.click();
  } catch {}
  // collapse offer popup if present
  try {
    await page.evaluate(() => {
      document.documentElement.classList.add("offer-collapsed");
      const overlays = document.querySelectorAll(".cookie-banner, [class*=cookie]");
    });
  } catch {}
  await page.waitForTimeout(800);
}

async function main() {
  const server = await serveClone(4173);
  const browser = await chromium.launch({ headless: true });

  for (const [label, url, mobile] of [
    ["orig", "https://forgeoftraders.com/", false],
    ["clone", "http://127.0.0.1:4173/", false],
    ["orig-m", "https://forgeoftraders.com/", true],
    ["clone-m", "http://127.0.0.1:4173/", true],
  ]) {
    const context = await browser.newContext(
      mobile
        ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
        : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
    );
    const page = await context.newPage();
    console.log("Capturing", label);
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await prepare(page);

    await page.screenshot({ path: path.join(OUT, `${label}-hero.png`) });

    const scrolls = mobile
      ? [0, 700, 1600, 2800, 4000, 5500]
      : [0, 900, 1800, 2800, 4000, 5200, 6500, 8000, 9500, 11000];

    for (let i = 0; i < scrolls.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), scrolls[i]);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, `${label}-s${i}.png`) });
    }
    await context.close();
  }

  await browser.close();
  server.close();
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
