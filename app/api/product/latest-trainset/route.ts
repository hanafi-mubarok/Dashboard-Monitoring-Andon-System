import { NextResponse } from 'next/server';
import { getLatestTrainsetFromProductionProgressProtrack } from '@/lib/queries/production-progress-protrack';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const project = url.searchParams.get('project');
    const line = url.searchParams.get('line');
    const workshop = url.searchParams.get('workshop');

    const trainset = await getLatestTrainsetFromProductionProgressProtrack(project || undefined, line === 'null' ? null : (line || undefined), workshop || undefined);
    return NextResponse.json({ success: true, trainset });
  } catch (error) {
    console.error('Failed to fetch latest trainset:', error);
    return NextResponse.json({ success: false, trainset: null }, { status: 500 });
  }
}
