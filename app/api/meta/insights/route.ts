import { NextResponse } from 'next/server';
import { fetchInsights } from '@/lib/meta';
import { fetchOdooLeadCount } from '@/lib/odoo';
import type { Dept } from '@/lib/types';
import { DEPTS } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

  // For Arash depts, fetch real Odoo lead count
  if (!isEkspert) {
    const leads = await fetchOdooLeadCount(dept, from, to);
    meta.totals.leads = leads;
    meta.totals.costPerLead = leads > 0 ? meta.totals.spend / leads : 0;
    meta.totals.msgToLead = meta.totals.messages > 0 ? (leads / meta.totals.messages) * 100 : 0;
    // Also augment daily with Odoo if needed (skip for performance)
  }

  return NextResponse.json(meta);
}
