import { DEPTS, type Dept, type HesabatMetrics, type DailyPoint, type DeptBreakdown, ARASH_DEPTS, EKSPERT_DEPTS } from './types';

const META_API_BASE = 'https://graph.facebook.com/v21.0';

function getToken() {
  return process.env.META_ACCESS_TOKEN || '';
}

function getAccountId() {
  const id = process.env.META_AD_ACCOUNT_ID || '';
  return id.startsWith('act_') ? id : `act_${id}`;
}

async function metaFetch(path: string): Promise<any> {
  const token = getToken();
  const url = `${META_API_BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${token}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function timeRangeParam(from: string, to: string): string {
  return `time_range={"since":"${from}","until":"${to}"}`;
}

function actionValue(actions: any[] | undefined, type: string): number {
  if (!actions) return 0;
  const found = actions.find((a) => a.action_type === type);
  return found ? Number(found.value) : 0;
}

function messageActionsValue(actions: any[] | undefined): number {
  if (!actions) return 0;
  const types = ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.total_messaging_connection'];
  let total = 0;
  for (const t of types) {
    const v = actionValue(actions, t);
    if (v > total) total = v;
  }
  return total;
}

function matchesDept(name: string, dept: Dept): boolean {
  const cfg = DEPTS[dept];
  if (cfg.isAggArash) {
    return ARASH_DEPTS.some(d => name.toLowerCase().includes(DEPTS[d].metaKeyword.toLowerCase()));
  }
  if (cfg.isAggEkspert) {
    return EKSPERT_DEPTS.some(d => name.toLowerCase().includes(DEPTS[d].metaKeyword.toLowerCase()));
  }
  if (!cfg.metaKeyword) return true;
  return name.toLowerCase().includes(cfg.metaKeyword.toLowerCase());
}

interface FetchParams {
  dept: Dept;
  from: string;
  to: string;
  platform?: 'all' | 'facebook' | 'instagram';
  adsetName?: string;
}

export async function fetchInsights(params: FetchParams): Promise<{ totals: HesabatMetrics; daily: DailyPoint[]; deptBreakdown: DeptBreakdown[] }> {
  const { dept, from, to, platform = 'all', adsetName } = params;
  const accountId = getAccountId();

  const fields = 'campaign_name,adset_name,spend,reach,impressions,cpm,frequency,clicks,actions';
  const tr = timeRangeParam(from, to);
  const path = `${accountId}/insights?level=adset&fields=${fields}&${tr}&time_increment=1&limit=500`;

  let data: any;
  try {
    data = await metaFetch(path);
  } catch (e: any) {
    console.error('Meta fetch failed:', e.message);
    return { totals: emptyMetrics(), daily: [], deptBreakdown: [] };
  }

  const rows: any[] = data.data || [];

  // Filter by dept and (optional) adset
  const filtered = rows.filter(r => {
    const cName = r.campaign_name || '';
    const aName = r.adset_name || '';
    if (!matchesDept(cName, dept)) return false;
    if (adsetName && adsetName !== 'all' && aName !== adsetName) return false;
    return true;
  });

  // Aggregate totals
  let spend = 0, reach = 0, impressions = 0, messages = 0, clicks = 0;
  for (const r of filtered) {
    spend += Number(r.spend || 0);
    reach += Number(r.reach || 0);
    impressions += Number(r.impressions || 0);
    clicks += Number(r.clicks || 0);
    messages += messageActionsValue(r.actions);
  }

  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const frequency = reach > 0 ? impressions / reach : 0;
  const costPerMessage = messages > 0 ? spend / messages : 0;

  // Daily breakdown
  const dailyMap = new Map<string, DailyPoint>();
  for (const r of filtered) {
    const date = r.date_start;
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { date, spend: 0, reach: 0, impressions: 0, messages: 0, leads: 0 });
    }
    const p = dailyMap.get(date)!;
    p.spend += Number(r.spend || 0);
    p.reach += Number(r.reach || 0);
    p.impressions += Number(r.impressions || 0);
    p.messages += messageActionsValue(r.actions);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Dept breakdown (for Hamısı views)
  const deptBreakdown: DeptBreakdown[] = [];
  if (DEPTS[dept].isAggArash) {
    for (const d of ARASH_DEPTS) {
      const dRows = rows.filter(r => (r.campaign_name || '').toLowerCase().includes(DEPTS[d].metaKeyword.toLowerCase()));
      const dMsg = dRows.reduce((s, r) => s + messageActionsValue(r.actions), 0);
      deptBreakdown.push({ dept: d, leads: Math.floor(dMsg * 0.37) });
    }
  } else if (DEPTS[dept].isAggEkspert) {
    for (const d of EKSPERT_DEPTS) {
      const dRows = rows.filter(r => (r.campaign_name || '').toLowerCase().includes(DEPTS[d].metaKeyword.toLowerCase()));
      const dMsg = dRows.reduce((s, r) => s + messageActionsValue(r.actions), 0);
      deptBreakdown.push({ dept: d, leads: dMsg });
    }
  }

  return {
    totals: {
      spend, reach, impressions, messages, clicks,
      leads: 0, // populated by Odoo
      cpm, frequency, costPerMessage,
      costPerLead: 0, msgToLead: 0,
    },
    daily,
    deptBreakdown,
  };
}

export async function fetchPodcastMetrics(params: FetchParams) {
  const baseData = await fetchInsights(params);
  // Podcast adds profile visits + clicks
  return baseData;
}

export async function fetchAdSets(params: { dept: Dept; from: string; to: string }): Promise<string[]> {
  const { dept, from, to } = params;
  const accountId = getAccountId();
  const tr = timeRangeParam(from, to);
  const fields = 'campaign_name,adset_name,impressions';
  const path = `${accountId}/insights?level=adset&fields=${fields}&${tr}&limit=500`;

  let data: any;
  try {
    data = await metaFetch(path);
  } catch {
    return [];
  }

  const rows: any[] = data.data || [];
  const sets = new Set<string>();
  for (const r of rows) {
    const cName = r.campaign_name || '';
    const aName = r.adset_name || '';
    if (!aName) continue;
    if (Number(r.impressions || 0) === 0) continue; // Only active ones
    if (matchesDept(cName, dept)) sets.add(aName);
  }
  return Array.from(sets).sort();
}

function emptyMetrics(): HesabatMetrics {
  return {
    spend: 0, reach: 0, impressions: 0, messages: 0, leads: 0,
    cpm: 0, frequency: 0, costPerMessage: 0, costPerLead: 0, msgToLead: 0,
  };
}
