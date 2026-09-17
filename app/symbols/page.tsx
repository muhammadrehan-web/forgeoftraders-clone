import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages["symbols"].metadata;

export default function Page() {
  return <HtmlPage id="symbols" />;
}
