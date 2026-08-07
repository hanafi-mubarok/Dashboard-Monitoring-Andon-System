"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

export default function PengadaanKanbanSection({
  dateRangeLabel,
  daysFilter,
  setDaysFilter,
  projectFilter,
  setProjectFilter,
  projectOptions,
  filterLoading,
  filterError,
  data,
  expandedRequestPRs,
  expandedPRs,
  expandedPOs,
  expandedGRs,
  requestPRDetailsBySurat,
  requestPRDetailLoading,
  requestPRDetailError,
  prDetailsByPr,
  prDetailLoading,
  prDetailError,
  poDetailsByPo,
  grDetailsByProject,
  poDetailLoading,
  grDetailLoading,
  poDetailError,
  grDetailError,
  toggleRequestPRDetails,
  togglePRDetails,
  togglePODetails,
  toggleGRDetails,
  renderStatusBadge,
  getAvgLeadTimePrBadgeClass,
  formatDateOnly,
  formatAvgLeadTimePr,
  renderMaterialQuantities,
  getEffectiveStatus,
}) {
  const prList = Array.isArray((data || {}).kanban_pr) ? data.kanban_pr : [];
  const requestPR = Array.isArray((data || {}).kanban_req_pr) ? data.kanban_req_pr : [];
  const poList = Array.isArray((data || {}).kanban_po) ? data.kanban_po : [];

  const reqPR = requestPR;
  const prosesPR = prList.filter((p) => Number(p.percentage_item_pr) < 100);
  const prosesPO = poList.filter((p) => Number(p.percentage_item_po) < 100);
  const grList = Array.isArray((data || {}).kanban_gr) ? data.kanban_gr : [];

  return (
    <div style={{ marginTop: 18 }}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end">
          <div className="flex flex-col">
            <div className="text-sm text-gray-300">Rentang data</div>
            <div className="text-xs text-gray-400">{dateRangeLabel}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-300">Periode filter</div>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
            >
              <option value={3}>3 Hari Terakhir</option>
              <option value={7}>7 Hari Terakhir</option>
              <option value={14}>14 Hari Terakhir</option>
              <option value={30}>30 Hari Terakhir</option>
              <option value={90}>90 Hari Terakhir</option>
              <option value={180}>6 Bulan Terakhir</option>
              <option value={365}>1 Tahun Terakhir</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-300">Project filter</div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="min-w-[180px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
            >
              <option value="">Semua Project</option>
              {projectOptions.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {filterLoading ? <span>Memuat data...</span> : <span></span>}
        {filterError ? <span className="text-rose-400">{filterError}</span> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <KanbanColumn title="Request PR" badgeBg="bg-gray-400" count={reqPR.length}>
          {reqPR.length > 0 ? reqPR.map((r, idx) => (
            <Card key={`req-${r.no_surat}-${idx}`} className="bg-slate-900 border border-slate-700 hover:border-gray-500 transition-colors">
              <CardContent className="px-3 py-0.5">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div className="space-y-0.5 min-w-0 leading-tight">
                    <div title={r.project_name ?? r.no_surat} className="text-sm font-semibold text-white truncate">{r.project_name ?? r.no_surat}</div>
                    <div title={r.no_surat} className="text-xs text-gray-300 truncate">{r.no_surat}</div>
                    <div title={r.pic} className="text-xs text-gray-300 mt-0.5 truncate">{r.pic}</div>
                    <div className="text-xs text-gray-300 mt-0.5 truncate">{formatDateOnly(r.tanggal)}</div>
                    <Badge className={`${getAvgLeadTimePrBadgeClass(r.lead_time)}`}>Lead Time: {formatAvgLeadTimePr(r.lead_time)} Hari</Badge>
                  </div>
                  <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                    <div className="text-xs font-semibold text-white">{r.jumlah_item_diproses ?? 0} / {r.jumlah_item ?? '-'}</div>
                    <div className="text-xs text-gray-300 mt-0.5">{r.persentase_diproses ?? '0'}%</div>
                    {r.link ? (
                      <button
                        type="button"
                        onClick={() => window.open(r.link, "_blank")}
                        className="self-end mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-cyan-300 transition hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
                        aria-label="Lihat dokumen"
                        title="Lihat dokumen"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    ) : null}
                    {r.no_surat ? (
                      <button
                        type="button"
                        onClick={() => toggleRequestPRDetails(r.no_surat)}
                        aria-label={expandedRequestPRs[r.no_surat] ? 'Tutup detail material' : 'Buka detail material'}
                        className="self-end mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-300 transition hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
                      >
                        {expandedRequestPRs[r.no_surat] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </div>
                </div>
                {expandedRequestPRs[r.no_surat] ? (
                  <div className="mt-3 bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-xs text-gray-300">
                    {requestPRDetailLoading[r.no_surat] ? (
                      <div className="text-gray-400">Memuat detail material...</div>
                    ) : requestPRDetailError[r.no_surat] ? (
                      <div className="text-rose-400">{requestPRDetailError[r.no_surat]}</div>
                    ) : Array.isArray(requestPRDetailsBySurat[r.no_surat]) && requestPRDetailsBySurat[r.no_surat].length > 0 ? (
                      <div className="space-y-2">
                        {requestPRDetailsBySurat[r.no_surat].map((item) => (
                          <div key={`${r.no_surat}-${item.no_item_pr}`} className="grid grid-cols-[1fr_auto] gap-2 items-start border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                            <div className="min-w-0">
                              <div className="text-[11px] text-gray-300 mt-1">{item.kode_material}</div>
                              <div className="text-xs font-semibold text-white break-words" title={item.material_name}>{item.material_name}</div>
                              {renderMaterialQuantities(item, true)}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderStatusBadge(getEffectiveStatus(item.status, item.qty_requested, item.qty_ordered, item.qty_arrived))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">Tidak ada detail material.</div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )) : (
            <p className="text-gray-500 text-sm mt-4 text-center">Belum ada data</p>
          )}
        </KanbanColumn>

        <KanbanColumn title="Proses PR" badgeBg="bg-red-400" count={prosesPR.length}>
          {prosesPR.length > 0 ? prosesPR.map((r, idx) => {
            const detailKey = r.project_code ?? r.no_pr;
            return (
              <Card key={`propr-${detailKey}-${idx}`} className="bg-slate-900 border border-slate-700 hover:border-red-500 transition-colors">
                <CardContent className="relative px-3 py-0.5">
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <div className="space-y-0.5 min-w-0 leading-tight">
                      <div className="text-sm font-semibold text-white truncate">{r.project_code ?? r.no_pr}</div>
                      <div className="text-xs text-gray-400 truncate">{r.wbs ?? '-'}</div>
                      <div className="text-xs text-gray-400 truncate">Total PR: {r.total_pr ?? '-'}</div>
                      <Badge className={`${getAvgLeadTimePrBadgeClass(r.avg_lead_time_pr)}`}>PR Aging: {formatAvgLeadTimePr(r.avg_lead_time_pr)} Hari</Badge>
                    </div>
                    <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                      <div className="text-xs font-semibold text-white">{r.item_pr_diproses ?? 0} / {r.total_item_pr ?? '-'}</div>
                      <div className="text-xs text-gray-400">PR Terakhir</div>
                      <div className="text-xs text-gray-300 mt-0.5 truncate">{formatDateOnly(r.request_date)}</div>
                      <div className="text-xs font-semibold text-white">{r.percentage_item_pr ?? '0'}%</div>
                      {detailKey ? (
                        <button
                          type="button"
                          onClick={() => togglePRDetails(detailKey, Boolean(r.project_code))}
                          aria-label={expandedPRs[detailKey] ? 'Tutup detail material' : 'Buka detail material'}
                          className="self-end mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-300 transition hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
                        >
                          {expandedPRs[detailKey] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {expandedPRs[detailKey] ? (
                    <div className="mt-3 bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-xs text-gray-300">
                      {prDetailLoading[detailKey] ? (
                        <div className="text-gray-400">Memuat detail material...</div>
                      ) : prDetailError[detailKey] ? (
                        <div className="text-rose-400">{prDetailError[detailKey]}</div>
                      ) : Array.isArray(prDetailsByPr[detailKey]) && prDetailsByPr[detailKey].length > 0 ? (
                        <div className="space-y-2">
                          {prDetailsByPr[detailKey].map((item) => (
                            <div key={`${detailKey}-${item.no_item_pr}`} className="grid grid-cols-[1fr_auto] gap-2 items-start border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                              <div className="min-w-0">
                                <div className="text-[11px] text-gray-300 mt-1">{item.komat}</div>
                                <div className="text-xs font-semibold text-white break-words" title={item.material_name}>{item.material_name}</div>
                                {renderMaterialQuantities(item)}
                                <div className="text-[11px] text-gray-300 mt-1">No PR: {item.no_pr}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {renderStatusBadge(getEffectiveStatus(item.status, item.qty_requested, item.qty_ordered, item.qty_arrived))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400">Tidak ada detail material.</div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          }) : (
            <p className="text-gray-500 text-sm mt-4 text-center">Belum ada data</p>
          )}
        </KanbanColumn>

        <KanbanColumn title="Proses PO" badgeBg="bg-amber-400" count={prosesPO.length}>
          {prosesPO.length > 0 ? prosesPO.map((p, idx) => (
            <Card key={`pp-${p.project_code}-${idx}`} className="bg-slate-900 border border-slate-700 hover:border-amber-500 transition-colors">
              <CardContent className="relative px-3 py-0.5">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div className="space-y-0.5 min-w-0 leading-tight">
                    <div className="text-sm font-semibold text-white truncate">{p.project_code}</div>
                    <div className="text-xs text-gray-300 truncate">{p.wbs ?? '-'}</div>
                    <div className="text-xs text-gray-300 truncate">Total PO: {p.total_po}</div>
                    <Badge className={`${getAvgLeadTimePrBadgeClass(p.avg_lead_time_po ?? p.avg_lead_time)}`}>PO Aging: {formatAvgLeadTimePr(p.avg_lead_time_po ?? p.avg_lead_time)} Hari</Badge>
                  </div>
                  <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                    <div className="text-xs font-semibold text-white">{p.item_po_diproses ?? 0} / {p.total_item_po ?? '-'}</div>
                    <div className="text-xs text-gray-400">PO Terakhir</div>
                    <div className="text-xs text-gray-300 mt-0.5 truncate">{formatDateOnly(p.po_date)}</div>
                    <div className="text-xs text-gray-300 mt-0.5">{p.percentage_item_po ?? '0'}%</div>
                    {p.project_code ? (
                      <button
                        type="button"
                        onClick={() => togglePODetails(p.project_code)}
                        aria-label={expandedPOs[p.project_code] ? 'Tutup detail material' : 'Buka detail material'}
                        className="self-end mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-300 transition hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
                      >
                        {expandedPOs[p.project_code] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </div>
                </div>
                {expandedPOs[p.project_code] ? (
                  <div className="mt-3 bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-xs text-gray-300">
                    {poDetailLoading[p.project_code] ? (
                      <div className="text-gray-400">Memuat detail material...</div>
                    ) : poDetailError[p.project_code] ? (
                      <div className="text-rose-400">{poDetailError[p.project_code]}</div>
                    ) : Array.isArray(poDetailsByPo[p.project_code]) && poDetailsByPo[p.project_code].length > 0 ? (
                      <div className="space-y-2">
                        {poDetailsByPo[p.project_code].map((item) => (
                          <div key={`${p.project_code}-${item.no_item_po}`} className="grid grid-cols-[1fr_auto] gap-2 items-start border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                            <div className="min-w-0">
                               <div className="text-[11px] text-gray-300 mt-1">{item.komat}</div>
                              <div className="text-xs font-semibold text-white break-words" title={item.material_name}>{item.material_name}</div>
                              {renderMaterialQuantities(item)}
                              <div className="text-[11px] text-gray-300 mt-1">No PO: {item.no_po}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderStatusBadge(getEffectiveStatus(item.status, item.qty_requested, item.qty_ordered, item.qty_arrived))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">Tidak ada detail material.</div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )) : (
            <p className="text-gray-500 text-sm mt-4 text-center">Belum ada data</p>
          )}
        </KanbanColumn>

        <KanbanColumn title="GR (Kedatangan)" badgeBg="bg-emerald-400" count={grList.length}>
          {grList.length > 0 ? grList.map((p, idx) => (
            <Card key={`gr-${p.project_code}-${idx}`} className="bg-slate-900 border border-slate-700 hover:border-emerald-500 transition-colors">
              <CardContent className="relative px-3 py-0.5">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div className="space-y-0.5 min-w-0 leading-tight">
                    <div className="text-sm font-semibold text-white truncate">{p.project_code}</div>
                    <div className="text-xs text-gray-300 truncate">WBS: {p.wbs ?? '-'}</div>
                    <div className="text-xs text-gray-400 truncate">Arrival: {formatDateOnly(p.arrival_date)}</div>
                    <Badge className={`${getAvgLeadTimePrBadgeClass(p.avg_lead_time_gr ?? p.avg_lead_time)}`}>Lead Time: {formatAvgLeadTimePr(p.avg_lead_time_gr ?? p.avg_lead_time)} Hari</Badge>
                  </div>
                  <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                    <div className="text-xs font-semibold text-white">{p.item_gr_diproses ?? 0} / {p.total_item_gr ?? '-'}</div>
                    <div className="text-xs text-gray-300 mt-0.5">Selesai</div>
                    <div className="text-xs text-gray-300 mt-0.5">{p.percentage_item_gr ?? '100'}%</div>
                    {p.project_code ? (
                      <button
                        type="button"
                        onClick={() => toggleGRDetails(p.project_code)}
                        aria-label={expandedGRs[p.project_code] ? 'Tutup detail material' : 'Buka detail material'}
                        className="self-end mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-300 transition hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
                      >
                        {expandedGRs[p.project_code] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </div>
                </div>
                {expandedGRs[p.project_code] ? (
                  <div className="mt-3 bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-xs text-gray-300">
                    {grDetailLoading[p.project_code] ? (
                      <div className="text-gray-400">Memuat detail material...</div>
                    ) : grDetailError[p.project_code] ? (
                      <div className="text-rose-400">{grDetailError[p.project_code]}</div>
                    ) : Array.isArray(grDetailsByProject[p.project_code]) && grDetailsByProject[p.project_code].length > 0 ? (
                      <div className="space-y-2">
                        {grDetailsByProject[p.project_code].map((item) => (
                          <div key={`${p.project_code}-${item.no_item_po}`} className="grid grid-cols-[1fr_auto] gap-2 items-start border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                            <div className="min-w-0">
                              <div className="text-[11px] text-gray-300 mt-1">{item.komat}</div>
                              <div className="text-xs font-semibold text-white break-words" title={item.material_name}>{item.material_name}</div>
                              {renderMaterialQuantities(item)}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderStatusBadge(getEffectiveStatus(item.status, item.qty_requested, item.qty_ordered, item.qty_arrived))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">Tidak ada detail material.</div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )) : (
            <p className="text-gray-500 text-sm mt-4 text-center">Belum ada data</p>
          )}
        </KanbanColumn>
      </div>
    </div>
  );
}

function KanbanColumn({ title, badgeBg, count, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`rounded-lg p-3 border sticky top-0 z-10 ${badgeBg === 'bg-gray-400' ? 'bg-gray-700/50 border-gray-600' : badgeBg === 'bg-red-400' ? 'bg-red-700/40 border-red-600' : badgeBg === 'bg-amber-400' ? 'bg-amber-700/50 border-amber-600' : 'bg-emerald-700/40 border-emerald-600'}`}>
        <h3 className="text-white font-semibold text-sm flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${badgeBg}`}></div>
          {title}
        </h3>
        <div className="text-xs text-gray-200 text-center mt-1">{count} {title === 'Request PR' ? 'request' : title.includes('PR') ? 'PR' : 'PO'}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
