import { ForgePage } from "@/components/ForgePage";
import { pages } from "@/lib/pages";

export const metadata = pages["contact"].metadata;

export default function Page() {
  return <ForgePage id="contact" />;
}
