import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const PAGE_FILES: Record<string, string> = {
  "": "index.html",
  affiliate: "affiliate.html",
  careers: "careers.html",
  contact: "contact.html",
  evaluation: "evaluation.html",
  faqs: "faqs.html",
  "privacy-policy": "privacy-policy.html",
  symbols: "symbols.html",
  "terms-conditions": "terms-conditions.html",
  "compare-programs": "compare-programs.html",
};

export function serveHtmlPage(slug: string): NextResponse {
  const file = PAGE_FILES[slug];
  if (!file) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const fullPath = path.join(process.cwd(), "html-pages", file);
  if (!fs.existsSync(fullPath)) {
    return new NextResponse("Page missing", { status: 404 });
  }

  const html = fs.readFileSync(fullPath, "utf8");
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function listHtmlSlugs(): string[] {
  return Object.keys(PAGE_FILES).filter(Boolean);
}
