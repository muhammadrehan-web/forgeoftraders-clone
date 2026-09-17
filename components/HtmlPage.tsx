import fs from "node:fs";
import path from "node:path";

import { pages, type PageId } from "@/lib/pages";

export function HtmlPage({ id }: { id: PageId }) {
  const html = fs.readFileSync(
    path.join(process.cwd(), "content", pages[id].file),
    "utf8",
  );

  return (
    <div
      style={{ display: "contents" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
