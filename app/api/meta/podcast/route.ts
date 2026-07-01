import { NextResponse } from 'next/server';
import { fetchPodcastMetrics } from '@/lib/meta';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const data = await fetchPodcastMetrics({ dept: 'podcast', from, to });
  return NextResponse.json(data);
}
