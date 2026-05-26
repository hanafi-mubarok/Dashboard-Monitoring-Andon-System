// app/operator/page.tsx

import Link from 'next/link';
import ModernSidebar from "@/components/ui/sidebar";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OperatorGraphicsChart from '@/components/operator/OperatorGraphicsChart';
import { getOperatorsGraphics, getOperatorsOEE } from '@/lib/queries/operator';
import { Users } from 'lucide-react';
export const dynamic = 'force-dynamic';

const formatNumber = (num: number | null | undefined): string => {
  if (num == null || !Number.isFinite(num)) return '—';
  return num.toLocaleString('id-ID');
};

const getOEEStatusColor = (oee: number | null | undefined) => {
  if (oee == null || !Number.isFinite(oee)) return '!text-gray-300 !border-gray-500/70 !bg-gray-500/10';
  if (oee >= 85) return '!text-emerald-300 !border-emerald-400/80 !bg-emerald-500/15';
  if (oee >= 70) return '!text-blue-300 !border-blue-400/80 !bg-blue-500/15';
  if (oee >= 50) return '!text-amber-300 !border-amber-400/80 !bg-amber-500/15';
  return '!text-rose-300 !border-rose-400/80 !bg-rose-500/15';
};

export default async function OperatorProfilePage() {
  const [operators, operatorGraphics] = await Promise.all([
    getOperatorsOEE(),
    getOperatorsGraphics(),
  ]);

  return (
    <ModernSidebar>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            Operator Profile
          </h1>

        


          <p className="text-gray-400">Daftar profil operator berdasarkan data OEE terbaru.</p>
        </div>

        <OperatorGraphicsChart data={operatorGraphics} />

        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 backdrop-blur-sm p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700/50 hover:bg-transparent">
                <TableHead className="text-gray-300">NIP</TableHead>
                <TableHead className="text-gray-300">Nama Operator</TableHead>
                <TableHead className="text-gray-300 leading-tight">
                  Produk yang Paling 
                  <br />
                  Sering Dikerjakan
                </TableHead>
                  <TableHead className="text-gray-300 leading-tight">
                   Produk
                  <br />
                  Diselesaikan
                </TableHead>
                                <TableHead className="text-gray-300 leading-tight">
                  Total 
                  <br />
                  Jam Kerja
                </TableHead>
                <TableHead className="text-gray-300 leading-tight">
                  Presentase 
                  <br />
                  Terlambat
                </TableHead>
                <TableHead className="text-gray-300 leading-tight">
                  Presentase 
                  <br />
                  Not OK
                </TableHead>
                <TableHead className="text-gray-300">OEE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((operator) => {
                const oeeColor = getOEEStatusColor(operator.oee_percent);
                return (
                  <TableRow key={operator.operator_nip} className="border-gray-700/50 hover:bg-gray-700/20">
                    <TableCell className="text-blue-300 font-semibold">
                      <Link href={`/operator/${operator.operator_nip}`} className="hover:text-blue-200 hover:underline transition-colors">
                        {operator.operator_nip}
                      </Link>
                    </TableCell>
                    <TableCell className="text-white">{operator.operator_name}</TableCell>
                    <TableCell className="text-gray-200">{operator.produk_terbanyak || '—'}</TableCell>
                    <TableCell className="text-amber-200">{formatNumber(operator.jumlah_tunggu_qc)}</TableCell>
                    <TableCell className="text-cyan-300">{`${operator.total_jam_kerja} jam`}</TableCell>
                    <TableCell className="text-amber-300">
                      {operator.persen_terlambat !== null ? `${operator.persen_terlambat}%` : '—'}
                    </TableCell>
                    <TableCell className="text-rose-300">
                      {operator.reject_rate_percent !== null ? `${operator.reject_rate_percent}%` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={oeeColor}>
                        {operator.oee_percent !== null ? `${operator.oee_percent}%` : '—'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/*
        <iframe
          width="600"
          height="338"
          src="https://lookerstudio.google.com/embed/reporting/88485eb6-9308-478e-993e-fed686a59688/page/p_nxgphctb1d"
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
        */}
      </div>
    </ModernSidebar>
  );
}
