"use client";

import React from "react";
import { formatNumber } from "@/components/material/pengadaan-utils";

export default function VendorPerformance({ vendors }) {
  return (
    <div className="mt-4">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Vendor dengan Lead Time Terlama</p>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {(Array.isArray(vendors) ? vendors : []).length > 0 ? (
          vendors.map((vendor, index) => (
            <div key={`${vendor.vendor_name ?? 'vendor'}-${index}`} className="flex flex-col gap-0.5 rounded-lg border border-gray-700/60 bg-gray-950/30 px-3 py-2">
              <p className="truncate text-sm font-semibold text-white">{vendor.vendor_name ?? 'Vendor Tidak Diketahui'}</p>
              <p className="truncate text-xs text-gray-400 leading-tight">
                Qty PO: {formatNumber(vendor.total_qty_ordered ?? 0)} · Qty GR: {formatNumber(vendor.total_qty_arrived ?? 0)} · {Number(vendor.percentage_arrived ?? 0).toFixed(0)}%
              </p>
              <p className="truncate text-xs text-gray-400 leading-tight">Lead Time: {vendor.avg_lead_time ?? '-'} hari</p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-700 px-3 py-2 text-sm text-gray-500">
            Tidak ada data vendor performance untuk periode ini.
          </div>
        )}
      </div>
    </div>
  );
}
