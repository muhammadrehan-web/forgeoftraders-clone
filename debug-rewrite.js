const fs = require("fs");
let out = fs.readFileSync("original.html", "utf8");

const steps = [
  ["sst", /<script[^>]*sst\.forgeoftraders[^>]*>[\s\S]*?<\/script>/gi],
  ["clarity", /<script[^>]*clarity\.ms[\s\S]*?<\/script>/gi],
  ["gtm-src", /<script[^>]*googletagmanager[\s\S]*?<\/script>/gi],
  ["gtag-fn", /<script>[\s\S]*?gtag\([\s\S]*?<\/script>/gi],
  ["analytics", /<script[^>]*analytics\.js[^>]*><\/script>/gi],
  ["push", /<script[^>]*pushpushgo[^>]*><\/script>/gi],
  ["dwin", /<script[^>]*dwin1\.com[^>]*><\/script>/gi],
  ["noscript", /<noscript>[\s\S]*?GTM[\s\S]*?<\/noscript>/gi],
  ["iframe", /<iframe[^>]*sst\.forgeoftraders[^>]*><\/iframe>/gi],
];

for (const [name, re] of steps) {
  const before = out.length;
  const matches = out.match(re);
  out = out.replace(re, "");
  console.log(
    name,
    before,
    "->",
    out.length,
    "delta",
    before - out.length,
    "matches",
    matches ? matches.length : 0,
    matches ? matches.map((m) => m.length) : []
  );
}

console.log("body still?", out.includes("<body"));
console.log("forge a real?", /FORGE A/i.test(out));
