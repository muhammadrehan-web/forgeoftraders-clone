import { serveHtmlPage } from "@/lib/serveHtml";

export function GET() {
  return serveHtmlPage("terms-conditions");
}
