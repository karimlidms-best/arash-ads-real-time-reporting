import { DEPTS, type Dept, ARASH_DEPTS, EKSPERT_DEPTS, type OdooLead } from './types';

const ODOO_URL = process.env.ODOO_URL || '';
const ODOO_DB = process.env.ODOO_DB || '';
const ODOO_USER = process.env.ODOO_USERNAME || '';
const ODOO_KEY = process.env.ODOO_API_KEY || '';

let cachedUid: number | null = null;

async function authenticate(): Promise<number> {
  if (cachedUid) return cachedUid;
  const url = `${ODOO_URL}/jsonrpc`;
  const body = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'common',
      method: 'authenticate',
      args: [ODOO_DB, ODOO_USER, ODOO_KEY, {}],
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Odoo auth failed: ${res.status}`);
  const json = await res.json();
  if (!json.result) throw new Error('Odoo auth: no UID returned');
  cachedUid = json.result;
  return cachedUid as number;
}

async function odooCall(model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
  const uid = await authenticate();
  const url = `${ODOO_URL}/jsonrpc`;
  const body = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [ODOO_DB, uid, ODOO_KEY, model, method, args, kwargs],
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Odoo ${model}.${method} failed: ${res.status}`);
  const json = await res.json();
  if (json.error) {
    console.error('Odoo error', json.error);
    throw new Error(json.error.message || 'Odoo error');
  }
  return json.result;
}

function matchesDept(name: string, dept: Dept): boolean {
  if (!name) return false;
  const cfg = DEPTS[dept];
  const lc = name.toLowerCase();
  if (cfg.isAggArash) return ARASH_DEPTS.some(d => lc.includes(DEPTS[d].metaKeyword.toLowerCase()));
  if (cfg.isAggEkspert) return EKSPERT_DEPTS.some(d => lc.includes(DEPTS[d].metaKeyword.toLowerCase()));
  if (!cfg.metaKeyword) return true;
  return lc.includes(cfg.metaKeyword.toLowerCase());
}

function getDeptFromName(name: string): Dept | null {
  if (!name) return null;
  const lc = name.toLowerCase();
  for (const d of [...ARASH_DEPTS, ...EKSPERT_DEPTS]) {
    if (lc.includes(DEPTS[d].metaKeyword.toLowerCase())) return d;
  }
  return null;
}

export interface SatisFilters {
  dept: Dept;
  from: string;
  to: string;
  tag?: string;
  campaign?: string;
  source?: string;
}

export interface SatisData {
  closeRate: number;
  wonCount: number;
  closedCount: number;
  totalLeads: number;
  totalOpps: number;
  revenue: number;
  openOpportunities: number;
  dailyLeads: { date: string; total: number; won: number }[];
  sourceBreakdown: { name: string; count: number }[];
  tagBreakdown: { name: string; count: number }[];
}

export async function fetchSatisData(filters: SatisFilters): Promise<SatisData> {
  try {
    const { dept, from, to, tag, campaign, source } = filters;

    const domain: any[] = [
      ['create_date', '>=', from + ' 00:00:00'],
      ['create_date', '<=', to + ' 23:59:59'],
    ];

    const fields = ['id', 'name', 'type', 'stage_id', 'probability', 'date_closed', 'date_open',
                    'source_id', 'campaign_id', 'medium_id', 'tag_ids', 'expected_revenue',
                    'create_date', 'active'];

    const leads = await odooCall('crm.lead', 'search_read', [domain], { fields, limit: 5000 });

    // Resolve tag names
    const allTagIds = new Set<number>();
    for (const l of leads) {
      for (const t of (l.tag_ids || [])) allTagIds.add(t);
    }
    let tagMap: Record<number, string> = {};
    if (allTagIds.size > 0) {
      const tagRecords = await odooCall('crm.tag', 'read', [Array.from(allTagIds)], { fields: ['id', 'name'] });
      for (const t of tagRecords) tagMap[t.id] = t.name;
    }

    // Get won stages
    const stageRecords = await odooCall('crm.stage', 'search_read', [[]], { fields: ['id', 'name', 'is_won'] });
    const wonStageIds = new Set<number>(stageRecords.filter((s: any) => s.is_won).map((s: any) => s.id));

    // Filter by dept (by campaign/source name)
    const deptLeads = leads.filter((l: any) => {
      const campName = l.campaign_id ? l.campaign_id[1] : '';
      const srcName = l.source_id ? l.source_id[1] : '';
      const inDept = matchesDept(campName, dept) || matchesDept(srcName, dept);
      if (!inDept) return false;

      // Apply other filters
      if (tag && tag !== 'all') {
        const leadTagNames = (l.tag_ids || []).map((t: number) => tagMap[t] || '');
        if (!leadTagNames.includes(tag)) return false;
      }
      if (campaign && campaign !== 'all') {
        if (campName !== campaign) return false;
      }
      if (source && source !== 'all') {
        if (srcName !== source) return false;
      }
      return true;
    });

    const opps = deptLeads.filter((l: any) => l.type === 'opportunity');
    const wonOpps = opps.filter((l: any) => {
      const stageId = l.stage_id ? l.stage_id[0] : 0;
      return wonStageIds.has(stageId);
    });
    const lostOpps = opps.filter((l: any) => !l.active);

    // Close Rate: won / (won + lost), open opps excluded
    const closedCount = wonOpps.length + lostOpps.length;
    const closeRate = closedCount > 0 ? (wonOpps.length / closedCount) * 100 : 0;

    // Open Opportunities: SEPARATE query — filter-independent, always all-time active
    let openCount = 0;
    try {
      const openDomain: any[] = [
        ['type', '=', 'opportunity'],
        ['active', '=', true],
      ];
      const openLeads = await odooCall('crm.lead', 'search_read', [openDomain], {
        fields: ['id', 'stage_id', 'source_id', 'campaign_id'],
        limit: 10000,
      });
      const openDeptFiltered = openLeads.filter((l: any) => {
        const campName = l.campaign_id ? l.campaign_id[1] : '';
        const srcName = l.source_id ? l.source_id[1] : '';
        return matchesDept(campName, dept) || matchesDept(srcName, dept);
      });
      openCount = openDeptFiltered.filter((l: any) => {
        const stageId = l.stage_id ? l.stage_id[0] : 0;
        return !wonStageIds.has(stageId);
      }).length;
    } catch (e) {
      console.error('Open opps fetch failed:', e);
      openCount = 0;
    }

    const totalOpps = opps.length;
    const revenue = wonOpps.reduce((s: number, l: any) => s + (Number(l.expected_revenue) || 0), 0);

    // Daily breakdown
    const dailyMap = new Map<string, { total: number; won: number }>();
    for (const l of deptLeads) {
      const date = l.create_date.slice(0, 10);
      if (!dailyMap.has(date)) dailyMap.set(date, { total: 0, won: 0 });
      const p = dailyMap.get(date)!;
      p.total++;
      const stageId = l.stage_id ? l.stage_id[0] : 0;
      if (wonStageIds.has(stageId)) p.won++;
    }
    const dailyLeads = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));

    // Source breakdown
    const sourceMap = new Map<string, number>();
    for (const l of deptLeads) {
      const name = l.source_id ? l.source_id[1] : 'Müəyyən edilməyib';
      sourceMap.set(name, (sourceMap.get(name) || 0) + 1);
    }
    const sourceBreakdown = Array.from(sourceMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Tag breakdown
    const tagCountMap = new Map<string, number>();
    for (const l of deptLeads) {
      for (const tId of (l.tag_ids || [])) {
        const name = tagMap[tId] || 'Müəyyən edilməyib';
        tagCountMap.set(name, (tagCountMap.get(name) || 0) + 1);
      }
    }
    const tagBreakdown = Array.from(tagCountMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return {
      closeRate,
      wonCount: wonOpps.length,
      closedCount,
      totalLeads: deptLeads.length,
      totalOpps,
      revenue,
      openOpportunities: openCount,
      dailyLeads,
      sourceBreakdown,
      tagBreakdown,
    };
  } catch (e: any) {
    console.error('Odoo fetch failed:', e.message);
    return {
      closeRate: 0, wonCount: 0, closedCount: 0, totalLeads: 0, totalOpps: 0,
      revenue: 0, openOpportunities: 0,
      dailyLeads: [], sourceBreakdown: [], tagBreakdown: [],
    };
  }
}

export async function fetchOdooLeadCount(dept: Dept, from: string, to: string): Promise<number> {
  try {
    const domain = [
      ['create_date', '>=', from + ' 00:00:00'],
      ['create_date', '<=', to + ' 23:59:59'],
    ];
    const fields = ['campaign_id', 'source_id'];
    const leads = await odooCall('crm.lead', 'search_read', [domain], { fields, limit: 5000 });
    const filtered = leads.filter((l: any) => {
      const campName = l.campaign_id ? l.campaign_id[1] : '';
      const srcName = l.source_id ? l.source_id[1] : '';
      return matchesDept(campName, dept) || matchesDept(srcName, dept);
    });
    return filtered.length;
  } catch {
    return 0;
  }
}

export async function fetchTagsList(): Promise<string[]> {
  try {
    const tags = await odooCall('crm.tag', 'search_read', [[]], { fields: ['name'], limit: 200 });
    return tags.map((t: any) => t.name).filter((n: string) => !!n);
  } catch {
    return [];
  }
}

export async function fetchSourcesList(): Promise<string[]> {
  try {
    const sources = await odooCall('utm.source', 'search_read', [[]], { fields: ['name'], limit: 200 });
    return sources.map((s: any) => s.name).filter((n: string) => !!n);
  } catch {
    return [];
  }
}

export async function fetchCampaignsList(): Promise<string[]> {
  try {
    const campaigns = await odooCall('utm.campaign', 'search_read', [[]], { fields: ['name'], limit: 200 });
    return campaigns.map((c: any) => c.name).filter((n: string) => !!n);
  } catch {
    return [];
  }
}

export async function fetchOdooLeadsDaily(dept: Dept, from: string, to: string): Promise<{ date: string; leads: number }[]> {
  try {
    const domain = [
      ['create_date', '>=', from + ' 00:00:00'],
      ['create_date', '<=', to + ' 23:59:59'],
    ];
    const fields = ['campaign_id', 'source_id', 'create_date'];
    const leads = await odooCall('crm.lead', 'search_read', [domain], { fields, limit: 5000 });
    const filtered = leads.filter((l: any) => {
      const campName = l.campaign_id ? l.campaign_id[1] : '';
      const srcName = l.source_id ? l.source_id[1] : '';
      return matchesDept(campName, dept) || matchesDept(srcName, dept);
    });
    const dailyMap = new Map<string, number>();
    for (const l of filtered) {
      const date = String(l.create_date).slice(0, 10);
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    }
    return Array.from(dailyMap.entries())
      .map(([date, leads]) => ({ date, leads }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    console.error('Daily leads fetch failed:', e);
    return [];
  }
}
