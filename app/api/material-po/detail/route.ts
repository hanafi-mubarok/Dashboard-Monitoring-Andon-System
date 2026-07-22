import { NextRequest, NextResponse } from 'next/server';
import { getDetailMaterialPOByPO, getDetailMaterialPR } from '@/lib/queries/material_po';
import { getMaterialRequestPR } from '@/lib/queries/request_pr';

export async function GET(request: NextRequest) {
  try {
    const no_pr = request.nextUrl.searchParams.get('no_pr');
    const no_po = request.nextUrl.searchParams.get('no_po');
    const no_surat = request.nextUrl.searchParams.get('no_surat');
    const daysParam = request.nextUrl.searchParams.get('days');
    const projectCode = request.nextUrl.searchParams.get('project_code')?.trim() ?? '';

    const days = daysParam ? Number(daysParam) : undefined;
    const projectCodes = projectCode ? [projectCode] : undefined;

    if (!no_pr && !no_po && !no_surat) {
      return NextResponse.json(
        { success: false, error: 'Parameter no_pr, no_po, atau no_surat wajib diisi' },
        { status: 400 }
      );
    }

    const rows = no_pr
      ? await getDetailMaterialPR(no_pr, projectCodes, days)
      : no_po
      ? await getDetailMaterialPOByPO(no_po, projectCodes, days)
      : await getMaterialRequestPR(no_surat ?? undefined);

    return NextResponse.json({ success: true, rows }, { status: 200 });
  } catch (error) {
    console.error('API Error - gagal mengambil detail material PO:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail material PO' },
      { status: 500 }
    );
  }
}
