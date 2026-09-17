import { ForgePage } from "@/components/ForgePage";
import { pages } from "@/lib/pages";

export const metadata = pages.home.metadata;

export default function HomePage() {
  return <ForgePage id="home" />;
}
