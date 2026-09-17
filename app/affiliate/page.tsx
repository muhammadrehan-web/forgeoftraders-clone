import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages["affiliate"].metadata;

export default function Page() {
  return <HtmlPage id="affiliate" />;
}
