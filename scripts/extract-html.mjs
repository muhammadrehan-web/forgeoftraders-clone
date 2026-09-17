import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content");

const pages = [
  ["index.html", "home.html"],
  ["affiliate", "affiliate.html"],
  ["careers", "careers.html"],
  ["contact", "contact.html"],
  ["evaluation", "evaluation.html"],
  ["faqs", "faqs.html"],
  ["privacy-policy", "privacy-policy.html"],
  ["symbols", "symbols.html"],
  ["terms-conditions", "terms-conditions.html"],
  ["compare-programs", "compare-programs.html"],
];

function rewrite(html) {
  return html
    .replace(/(href|src|poster)=(["'])\.\//g, "$1=$2/")
    .replace(/url\((["']?)\.\//g, "url($1/")
    .replace(
      /(href=["'])\.\/(affiliate|careers|contact|evaluation|faqs|privacy-policy|symbols|terms-conditions|compare-programs)(["'])/g,
      "$1/$2$3",
    )
    .replace(/(action=["'])\.\/(faqs)(["'])/g, "$1/$2$3");
}

fs.mkdirSync(contentDir, { recursive: true });

const bodyClasses = {};

for (const [src, dest] of pages) {
  const srcPath = path.join(root, src);
  if (!fs.existsSync(srcPath)) {
    console.warn("missing", src);
    continue;
  }
  const raw = fs.readFileSync(srcPath, "utf8");
  const bodyOpen = raw.match(/<body([^>]*)>/i);
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`No body in ${src}`);

  const attrs = bodyOpen?.[1] || "";
  const classMatch = attrs.match(/class=["']([^"']*)["']/i);
  let bodyClass = classMatch?.[1] || "";
  if (!/\bui-finished\b/.test(bodyClass)) {
    bodyClass = `${bodyClass} ui-finished`.trim();
  }
  bodyClasses[dest.replace(/\.html$/, "")] = bodyClass;

  const body = rewrite(bodyMatch[1]).trim();
  fs.writeFileSync(path.join(contentDir, dest), `${body}\n`, "utf8");
  console.log("wrote content/" + dest, body.length, "class=", bodyClass);
}

const libDir = path.join(root, "lib");
fs.mkdirSync(libDir, { recursive: true });
fs.writeFileSync(
  path.join(libDir, "body-classes.json"),
  JSON.stringify(bodyClasses, null, 2),
  "utf8",
);
console.log("wrote lib/body-classes.json");
