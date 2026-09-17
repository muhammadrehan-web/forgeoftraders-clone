const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "clone");

async function main() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/") p = "/index.html";
    const f = path.join(root, p.replace(/^\//, ""));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404);
      res.end("nf " + p);
      return;
    }
    res.writeHead(200);
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(4174, r));

  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const failed = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(r.status() + " " + r.url());
  });
  page.on("requestfailed", (r) => {
    failed.push("FAIL " + r.url() + " " + (r.failure() && r.failure().errorText));
  });

  await page.goto("http://127.0.0.1:4174/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  console.log("failed count", failed.length);
  failed.forEach((x) => console.log(x));

  const heroInfo = await page.evaluate(() => {
    const pic = document.querySelector("picture img, img[src*='forge-hero']");
    if (!pic) return { missing: true };
    const cs = getComputedStyle(pic);
    return {
      src: pic.currentSrc || pic.src,
      naturalWidth: pic.naturalWidth,
      naturalHeight: pic.naturalHeight,
      clientWidth: pic.clientWidth,
      clientHeight: pic.clientHeight,
      opacity: cs.opacity,
      display: cs.display,
      visibility: cs.visibility,
      complete: pic.complete,
    };
  });
  console.log("hero", heroInfo);

  await b.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
