import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content");

const pages = [
  { src: "index.html", dest: "home.html" },
  { src: "affiliate", dest: "affiliate.html" },
  { src: "careers", dest: "careers.html" },
  { src: "contact", dest: "contact.html" },
  { src: "evaluation", dest: "evaluation.html" },
  { src: "faqs", dest: "faqs.html" },
  { src: "privacy-policy", dest: "privacy-policy.html" },
  { src: "symbols", dest: "symbols.html" },
  { src: "terms-conditions", dest: "terms-conditions.html" },
  { src: "compare-programs", dest: "compare-programs.html" },
];

function rewritePaths(html) {
  return html
    .replace(/(href|src|poster)=(["'])\.?\//g, "$1=$2/")
    .replace(/url\((["']?)\.\//g, "url($1/");
}

fs.mkdirSync(contentDir, { recursive: true });

for (const page of pages) {
  const srcPath = path.join(root, page.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`Skip missing ${page.src}`);
    continue;
  }
  const raw = fs.readFileSync(srcPath, "utf8");
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) {
    throw new Error(`No body found in ${page.src}`);
  }

  // Keep scripts — site depends on jQuery/bootstrap runtime + calculator
  const body = rewritePaths(bodyMatch[1]).trim();
  fs.writeFileSync(path.join(contentDir, page.dest), `${body}\n`);
  console.log(`Wrote content/${page.dest}`);
}
