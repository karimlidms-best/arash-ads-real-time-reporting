import { NextResponse } from 'next/server';
import { fetchSatisData } from '@/lib/odoo';
import type { Dept } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dept = (searchParams.get('dept') || 'hamisi-arash') as Dept;
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const tag = searchParams.get('tag') || 'all';
  const campaign = searchParams.get('campaign') || 'all';
  const source = searchParams.get('source') || 'all';

  if (!from || !to) return NextResponse.json({ error: 'from/to required' }, { status: 400 });

  const data = await fetchSatisData({ dept, from, to, tag, campaign, source });
  return NextResponse.json(data);
}
