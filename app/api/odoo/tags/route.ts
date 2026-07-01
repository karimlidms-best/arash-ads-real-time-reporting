import { NextResponse } from 'next/server';
import { fetchTagsList, fetchSourcesList, fetchCampaignsList } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [tags, sources, campaigns] = await Promise.all([
    fetchTagsList(),
    fetchSourcesList(),
    fetchCampaignsList(),
  ]);
  return NextResponse.json({ tags, sources, campaigns });
}
