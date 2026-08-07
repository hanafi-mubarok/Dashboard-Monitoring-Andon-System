import { NextResponse } from 'next/server';
import { syncMaterialPlotting } from '../../../../lib/plottingMaterialSync';

export async function GET() {
  try {
    const count = await syncMaterialPlotting();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
