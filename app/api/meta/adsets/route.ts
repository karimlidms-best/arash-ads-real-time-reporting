import { NextResponse } from 'next/server';
import { fetchAdSets } from '@/lib/meta';
import type { Dept } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dept = (searchParams.get('dept') || 'hamisi-arash') as Dept;
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  if (!from || !to) return NextResponse.json({ adsets: [] });
  const adsets = await fetchAdSets({ dept, from, to });
  return NextResponse.json({ adsets });
}
