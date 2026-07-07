import { getDistinctProjectNamesFromProductionProgressProtrack } from '@/lib/queries/production-progress-protrack';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workshop = url.searchParams.get('workshop') || 'Tiron';
    const data = await getDistinctProjectNamesFromProductionProgressProtrack(null, workshop);
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch project options for Tiron:', error);
    return Response.json({ success: false, error: 'Failed to fetch project options' }, { status: 500 });
  }
}
