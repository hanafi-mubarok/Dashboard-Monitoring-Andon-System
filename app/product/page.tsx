import ModernSidebar from "@/components/ui/sidebar";
import ProductPageClient from "@/components/product/ProductPageClient";
import { getProductStatsL3ByTrainset } from "@/lib/queries/production-progress";

export const dynamic = 'force-dynamic';

export default async function ProductPage() {
  const trainsetStats = await getProductStatsL3ByTrainset();

  return (
    <ModernSidebar>
      <ProductPageClient trainsetStats={trainsetStats} />
    </ModernSidebar>
  );
}




