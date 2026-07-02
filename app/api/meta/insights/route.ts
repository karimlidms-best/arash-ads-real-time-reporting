export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchInsights } from '@/lib/meta';
import { fetchOdooLeadCount, fetchOdooLeadsDaily } from '@/lib/odoo';
import type { Dept } from '@/lib/types';
import { DEPTS } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dept = (searchParams.get('dept') || 'hamisi-arash') as Dept;
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const platform = (searchParams.get('platform') || 'all') as any;
  const adsetName = searchParams.get('adset') || 'all';

  if (!from || !to) {
    return NextResponse.json({ error: 'from/to required' }, { status: 400 });
  }

  const meta = await fetchInsights({ dept, from, to, platform, adsetName });
  const isEkspert = DEPTS[dept].layout === 'ekspert';

  // For Arash depts, fetch real Odoo lead count + daily breakdown
  if (!isEkspert) {
    const [leadCount, dailyLeads] = await Promise.all([
      fetchOdooLeadCount(dept, from, to),
      fetchOdooLeadsDaily(dept, from, to),
    ]);
    meta.totals.leads = leadCount;
    meta.totals.costPerLead = leadCount > 0 ? meta.totals.spend / leadCount : 0;
    meta.totals.msgToLead = meta.totals.messages > 0 ? (leadCount / meta.totals.messages) * 100 : 0;

    // Merge daily leads into meta.daily
    const leadMap = new Map<string, number>();
    for (const p of dailyLeads) leadMap.set(p.date, p.leads);
    for (const day of meta.daily) {
      day.leads = leadMap.get(day.date) || 0;
    }
    // Also add dates that only appear in Odoo (not in Meta)
    for (const p of dailyLeads) {
      if (!meta.daily.find(d => d.date === p.date)) {
        meta.daily.push({ date: p.date, spend: 0, reach: 0, impressions: 0, messages: 0, leads: p.leads });
      }
    }
    meta.daily.sort((a, b) => a.date.localeCompare(b.date));
  }

  return NextResponse.json(meta);
}
