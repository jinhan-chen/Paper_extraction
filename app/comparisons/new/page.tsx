import { ComparisonCreateForm } from "@/components/comparison-create-form";
import { listPapers } from "@/lib/server/paper-repository";

export const dynamic = "force-dynamic";

export default async function ComparisonCreatePage() {
  const papers = await listPapers();
  return <ComparisonCreateForm papers={papers} />;
}
