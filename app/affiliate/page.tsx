import { ForgePage } from "@/components/ForgePage";
import { pages } from "@/lib/pages";

export const metadata = pages["affiliate"].metadata;

export default function Page() {
  return <ForgePage id="affiliate" />;
}
