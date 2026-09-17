import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages["privacy-policy"].metadata;

export default function Page() {
  return <HtmlPage id="privacy-policy" />;
}
