import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages["evaluation"].metadata;

export default function Page() {
  return <HtmlPage id="evaluation" />;
}
