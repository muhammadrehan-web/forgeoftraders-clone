import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "html-pages");

const pages = [
  ["index.html", "index.html"],
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
  let out = html
    .replace(/(href|src|poster)=(["'])\.\//g, "$1=$2/")
    .replace(/url\((["']?)\.\//g, "url($1/");

  // Keep local page links absolute for Next routes
  out = out
    .replace(/(href=["'])\.\/(affiliate|careers|contact|evaluation|faqs|privacy-policy|symbols|terms-conditions|compare-programs)(["'])/g, "$1/$2$3")
    .replace(/(action=["'])\.\/(faqs)(["'])/g, "$1/$2$3");

  if (!/ui-finished/.test(out)) {
    if (/<body[^>]*class="/i.test(out)) {
      out = out.replace(/<body([^>]*)class="/i, '<body$1class="ui-finished ');
    } else {
      out = out.replace(/<body/i, '<body class="ui-finished"');
    }
  }

  return out;
}

fs.mkdirSync(outDir, { recursive: true });

for (const [src, dest] of pages) {
  const srcPath = path.join(root, src);
  if (!fs.existsSync(srcPath)) {
    console.warn("missing", src);
    continue;
  }
  const html = rewrite(fs.readFileSync(srcPath, "utf8"));
  fs.writeFileSync(path.join(outDir, dest), html, "utf8");
  console.log("wrote", dest, html.length);
}
