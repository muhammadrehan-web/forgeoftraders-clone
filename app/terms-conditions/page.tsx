import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages["terms-conditions"].metadata;

export default function Page() {
  return <HtmlPage id="terms-conditions" />;
}
