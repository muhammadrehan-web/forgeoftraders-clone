import { ForgePage } from "@/components/ForgePage";
import { pages } from "@/lib/pages";

export const metadata = pages["privacy-policy"].metadata;

export default function Page() {
  return <ForgePage id="privacy-policy" />;
}
