import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages["faqs"].metadata;

export default function Page() {
  return <HtmlPage id="faqs" />;
}
