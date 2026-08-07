import ModernSidebar from "@/components/ui/sidebar";
import PlottingMaterialSection from "@/components/material/PlottingMaterialSection";
import { getPlottingMaterialTabel, getProdukKurangStackedbar, getStatusMaterial } from "../../../lib/queries/material_plotting";
import { syncMaterialPlotting } from "@/lib/plottingMaterialSync";

export const dynamic = 'force-dynamic';

export default async function PlottingMaterialPage() {

  try {
    const affectedRows = await syncMaterialPlotting();
    console.log(`[PlottingMaterialPage] syncMaterialPlotting affectedRows: ${affectedRows}`);
  } catch (error) {
    console.error("[PlottingMaterialPage] sync error", error);
  }

  const [plottingMaterialStackedBarData = [], plottingMaterialData = [], statusMaterialData = []] = await Promise.all([
    getProdukKurangStackedbar(),
    getPlottingMaterialTabel(),
    getStatusMaterial(),
  ]);

  return (
    <ModernSidebar>
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Plotting Material</h1>
          <p className="text-sm text-gray-400 mt-1">
            Menu untuk Plotting Material dengan status dan kebutuhan komponen.
          </p>
        </div>

        <PlottingMaterialSection
          stackedBarData={plottingMaterialStackedBarData}
          tableData={plottingMaterialData}
          statusMaterialData={statusMaterialData}
        />
      </div>
    </ModernSidebar>
  );
}
