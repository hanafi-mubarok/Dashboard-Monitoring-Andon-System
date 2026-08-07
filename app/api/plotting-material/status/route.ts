import { NextResponse } from 'next/server';
import { getStatusMaterial } from '@/lib/queries/material_plotting';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const project = url.searchParams.get('project') ?? undefined;
    const product = url.searchParams.get('product') ?? undefined;

    const data = await getStatusMaterial(project, product);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
