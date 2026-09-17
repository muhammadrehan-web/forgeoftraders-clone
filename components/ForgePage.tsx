import fs from "node:fs";
import path from "node:path";

import { HtmlPage } from "@/components/HtmlPage";
import { pages, type PageId } from "@/lib/pages";
import bodyClasses from "@/lib/body-classes.json";

function readContent(id: PageId): string {
  return fs.readFileSync(
    path.join(process.cwd(), "content", pages[id].file),
    "utf8",
  );
}

export function ForgePage({ id }: { id: PageId }) {
  const html = readContent(id);
  const key = pages[id].file.replace(/\.html$/, "");
  const bodyClass =
    (bodyClasses as Record<string, string>)[key] || "ui-finished";

  return <HtmlPage html={html} bodyClass={bodyClass} />;
}
