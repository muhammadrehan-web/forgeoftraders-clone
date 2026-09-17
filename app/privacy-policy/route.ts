import { serveHtmlPage } from "@/lib/serveHtml";

export function GET() {
  return serveHtmlPage("privacy-policy");
}
