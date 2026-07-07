import { NextResponse } from 'next/server';
import { getProductSummaryTiron } from '@/lib/queries/production-progress-protrack';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const trainset = url.searchParams.get('trainset');
    const workshop = url.searchParams.get('workshop') || 'Tiron';
    const project = url.searchParams.get('project_name') || url.searchParams.get('project') || undefined;

    if (!trainset) {
      return NextResponse.json({ success: false, data: [], message: 'Missing trainset' }, { status: 400 });
    }

    const data = await getProductSummaryTiron(trainset, workshop, project);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('summary-tiron route error:', error);
    return NextResponse.json({ success: false, data: [], message: 'Server error' }, { status: 500 });
  }
}
