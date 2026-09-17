import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages["compare-programs"].metadata;

export default function Page() {
  return <HtmlPage id="compare-programs" />;
}
