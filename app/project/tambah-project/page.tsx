import ModernSidebar from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import {
  getMasterProjectsWithFilters,
  getMasterProjectFilterOptions,
  type MasterProjectFilters,
} from "@/lib/queries/master_project";
import ProjectFiltersComponent from "./project-filters";
import ProjectTableClient from "./project-table-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

export default async function TambahkanProjectPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  
  const search = getQueryValue(resolvedSearchParams.search);
  const projectName = getQueryValue(resolvedSearchParams.project_name);
  const clientName = getQueryValue(resolvedSearchParams.client_name);
  const klasifikasi = getQueryValue(resolvedSearchParams.klasifikasi);
  const status = getQueryValue(resolvedSearchParams.status);
  const sortBy = getQueryValue(resolvedSearchParams.sortBy) || 'delivery_date';
  const sortDir = (getQueryValue(resolvedSearchParams.sortDir) || 'asc') as 'asc' | 'desc';

  const filters: MasterProjectFilters = {
    search: search || undefined,
    project_name: projectName || undefined,
    client_name: clientName || undefined,
    klasifikasi: klasifikasi || undefined,
    status: status || undefined,
    sortBy: (sortBy as any) || 'delivery_date',
    sortDir: sortDir,
  };

  const [projects, filterOptions] = await Promise.all([
    getMasterProjectsWithFilters(filters),
    getMasterProjectFilterOptions(),
  ]);

  const projectNameOptions =
    filterOptions.projectNameOptions.length > 0
      ? filterOptions.projectNameOptions
      : Array.from(
          new Set(
            projects
              .map((project) => project.project_name)
              .filter((value): value is string => Boolean(value && value.trim()))
          )
        );

  const clientNameOptions =
    filterOptions.clientNameOptions.length > 0
      ? filterOptions.clientNameOptions
      : Array.from(
          new Set(
            projects
              .map((project) => project.client_name)
              .filter((value): value is string => Boolean(value && value.trim()))
          )
        );

  const klasifikasiOptions =
    filterOptions.klasifikasiOptions.length > 0
      ? filterOptions.klasifikasiOptions
      : ['Manufacture', 'Trading', 'Jasa'];

  const statusOptions =
    filterOptions.statusOptions.length > 0
      ? filterOptions.statusOptions
      : [
          'Optimis Memenuhi',
          'Potensi Telat',
          'Close',
          'Terlambat',
          'Pengajuan ADD',
          'Proses PO Customer',
        ];

  const baseParams = new URLSearchParams();
  if (search) baseParams.set('search', search);
  if (projectName) baseParams.set('project_name', projectName);
  if (clientName) baseParams.set('client_name', clientName);
  if (klasifikasi) baseParams.set('klasifikasi', klasifikasi);
  if (status) baseParams.set('status', status);

  return (
    <ModernSidebar>
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tambahkan Project</h1>
          <p className="text-sm text-gray-400 mt-1">
            Data daftar project master dengan informasi lengkap dan status penyelesaian.
          </p>
        </div>

        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
          <CardContent className="p-4">
            <ProjectFiltersComponent
              projectNameOptions={projectNameOptions}
              clientNameOptions={clientNameOptions}
              klasifikasiOptions={klasifikasiOptions}
              statusOptions={statusOptions}
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
          <CardContent className="p-4 overflow-x-auto">
            <ProjectTableClient
              projects={projects}
              sortBy={sortBy}
              sortDir={sortDir}
              baseParams={baseParams.toString()}
            />
          </CardContent>
        </Card>
      </div>
    </ModernSidebar>
  );
}
