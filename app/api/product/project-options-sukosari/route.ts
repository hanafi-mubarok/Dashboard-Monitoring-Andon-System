import { getDistinctProjectNamesFromProductionProgressProtrack } from '@/lib/queries/production-progress-protrack';

export async function GET() {
  try {
    // For Sukosari we want project_name where line IS NULL and workshop = 'Sukosari'
    const data = await getDistinctProjectNamesFromProductionProgressProtrack(null, 'Sukosari');
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch project options for Sukosari:', error);
    return Response.json({ success: false, error: 'Failed to fetch project options' }, { status: 500 });
  }
}
