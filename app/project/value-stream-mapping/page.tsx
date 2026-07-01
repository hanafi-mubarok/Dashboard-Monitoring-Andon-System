import ModernSidebar from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ValueStreamMappingPage() {
  return (
    <ModernSidebar>
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Value Stream Mapping</h1>
          <p className="text-sm text-gray-400 mt-1">
            Template halaman untuk pemetaan aliran nilai project.
          </p>
        </div>

        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
          <CardContent className="p-6 space-y-4">
            <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/40 p-6 text-gray-300">
              Template ini siap diisi dengan diagram, metrik lead time, dan bottleneck process.
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Lead Time</p>
                <p className="mt-2 text-sm text-white">-</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Process Time</p>
                <p className="mt-2 text-sm text-white">-</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">WIP</p>
                <p className="mt-2 text-sm text-white">-</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Bottleneck</p>
                <p className="mt-2 text-sm text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernSidebar>
  );
}
