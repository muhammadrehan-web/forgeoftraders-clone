import { HtmlPage } from "@/components/HtmlPage";
import { pages } from "@/lib/pages";

export const metadata = pages.home.metadata;

export default function HomePage() {
  return <HtmlPage id="home" />;
}
