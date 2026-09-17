const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { URL } = require("url");

const ROOT = __dirname;
const MIRROR = path.join(ROOT, "clone");
const htmlPath = path.join(ROOT, "original.html");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "*/*",
          Referer: "https://forgeoftraders.com/",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          return fetchBuffer(next).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on("error", reject);
  });
}

function localPathFor(url) {
  const u = new URL(url);
  if (u.hostname === "forgeoftraders.com") {
    const p = u.pathname.replace(/^\//, "");
    if (!p || p.endsWith("/")) return null; // skip site root
    return path.join(MIRROR, p);
  }
  return path.join(MIRROR, "vendor", u.hostname, u.pathname.replace(/^\//, ""));
}

function collectUrls(html) {
  const urls = new Set();
  const add = (u) => {
    if (!u || u.startsWith("data:") || u.startsWith("mailto:") || u.startsWith("#") || u.startsWith("javascript:"))
      return;
    try {
      const abs = new URL(u, "https://forgeoftraders.com/").href.split("?")[0].split("#")[0];
      const host = new URL(abs).hostname;
      if (
        host === "forgeoftraders.com" ||
        host === "flagcdn.com" ||
        host === "i.ytimg.com"
      ) {
        if (abs === "https://forgeoftraders.com/" || abs === "https://forgeoftraders.com") return;
        urls.add(abs);
      }
    } catch {}
  };

  for (const m of html.matchAll(/(?:src|href|poster)=["']([^"']+)["']/g)) add(m[1]);
  for (const m of html.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) add(m[2]);

  const extras = [
    "https://forgeoftraders.com/templates/template2/assets/forge-6089a16ac694.css",
    "https://forgeoftraders.com/templates/template2/css/overrides.css",
    "https://forgeoftraders.com/common/js/jquery-3.7.1.min.js",
    "https://forgeoftraders.com/common/js/bootstrap.bundle.min.js",
    "https://forgeoftraders.com/templates/template2/assets/forge-runtime-76cf84f574c6.js",
    "https://forgeoftraders.com/templates/template2/assets/forge-runtime-a38ede34ae61.js",
    "https://forgeoftraders.com/templates/template2/assets/forge-runtime-25710bb714d9.js",
    "https://forgeoftraders.com/templates/template2/assets/calculator-scripts.js",
    "https://forgeoftraders.com/templates/template2/assets/forge-runtime-039e624119f2.js",
    "https://forgeoftraders.com/templates/template2/assets/forge-runtime-54e7741c9231.js",
    "https://forgeoftraders.com/templates/template2/assets/forge-runtime-b7f993cb2a81.js",
    "https://forgeoftraders.com/templates/template2/assets/forge-runtime-19812662d422.js",
    "https://forgeoftraders.com/templates/template2/fonts/poppins-400.woff2",
    "https://forgeoftraders.com/templates/template2/fonts/poppins-500.woff2",
    "https://forgeoftraders.com/templates/template2/fonts/poppins-600.woff2",
    "https://forgeoftraders.com/templates/template2/fonts/poppins-700.woff2",
    "https://forgeoftraders.com/templates/template2/fonts/forge-brand-icons.woff2",
    "https://forgeoftraders.com/templates/template2/fonts/forge-ui-icons.woff2",
  ];
  extras.forEach(add);
  return [...urls];
}

function stripTracking(html) {
  // Remove only known tracking script blocks by precise markers (never cross whole page)
  const patterns = [
    /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]+"><\/script>\s*/i,
    /<script>\s*window\.dataLayer\s*=\s*window\.dataLayer[\s\S]*?gtag\('config'[^<]*<\/script>\s*/i,
    /<script[^>]*src="[^"]*analytics\.js[^"]*"[^>]*><\/script>\s*/i,
    /<script[^>]*src="[^"]*pushpushgo[^"]*"[^>]*><\/script>\s*/i,
    /<script[^>]*src="[^"]*dwin1\.com[^"]*"[^>]*><\/script>\s*/i,
    /<script>\s*\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];[\s\S]*?sst\.forgeoftraders\.com[\s\S]*?<\/script>\s*/i,
    /<script type="text\/javascript">\s*\(function\(c,\s*l,\s*a,\s*r,\s*i,\s*t,\s*y\)[\s\S]*?clarity\.ms[\s\S]*?<\/script>\s*/i,
    /<noscript>\s*<iframe[^>]*googletagmanager[^>]*>[\s\S]*?<\/noscript>\s*/i,
    /<iframe[^>]*sst\.forgeoftraders[^>]*><\/iframe>\s*/i,
  ];
  let out = html;
  for (const re of patterns) out = out.replace(re, "");
  return out;
}

function rewriteHtml(html) {
  let out = stripTracking(html);

  // Rewrite absolute forge asset URLs to relative local paths
  out = out.replace(/https:\/\/forgeoftraders\.com\//g, "./");

  // External image CDNs used in UI
  out = out.replace(/https:\/\/flagcdn\.com\//g, "./vendor/flagcdn.com/");
  out = out.replace(/https:\/\/i\.ytimg\.com\//g, "./vendor/i.ytimg.com/");

  // Disable trustpilot widget remote script (optional chrome)
  out = out.replace(/src="\/\/widget\.trustpilot\.com[^"]*"/g, 'src=""');

  // Strip query cache-busters from local asset refs for simpler serving
  out = out.replace(/(\.\/(?:templates|common|storage|vendor)[^"'?\s]+)\?v=\d+/g, "$1");

  return out;
}

async function downloadAll(urls) {
  ensureDir(MIRROR);
  let ok = 0;
  let fail = 0;
  for (const url of urls) {
    const dest = localPathFor(url);
    if (!dest) continue;
    ensureDir(path.dirname(dest));
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      ok++;
      continue;
    }
    try {
      const buf = await fetchBuffer(url);
      fs.writeFileSync(dest, buf);
      ok++;
      process.stdout.write(`OK ${ok}/${urls.length}\r`);
    } catch (e) {
      fail++;
      console.warn(`\nFAIL ${url}: ${e.message}`);
    }
  }
  console.log(`\nDownloaded ${ok}, failed ${fail}`);
}

async function main() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const urls = collectUrls(html);
  console.log(`Collecting ${urls.length} assets...`);
  await downloadAll(urls);

  const rewritten = rewriteHtml(html);
  if (!rewritten.includes("FORGE A") || !rewritten.includes("<body")) {
    throw new Error("Rewrite destroyed page content — aborting write");
  }
  fs.writeFileSync(path.join(MIRROR, "index.html"), rewritten);
  console.log("Wrote clone/index.html, length", rewritten.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
