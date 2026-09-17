import { ForgePage } from "@/components/ForgePage";
import { pages } from "@/lib/pages";

export const metadata = pages["terms-conditions"].metadata;

export default function Page() {
  return <ForgePage id="terms-conditions" />;
}
