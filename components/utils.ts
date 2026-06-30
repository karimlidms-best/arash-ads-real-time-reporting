export const MONTHS_AZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
export const MONTHS_AZ_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_AZ[m - 1]} ${y}`;
}

export function fmtDateShort(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_AZ_SHORT[m - 1]}`;
}

export function monthLabel(value: string): string {
  if (value === 'custom') return 'Tarix aralığı';
  const [y, m] = value.split('-').map(Number);
  return `${MONTHS_AZ[m - 1]} ${y}`;
}

export function monthBounds(year: number, monthIdx: number): { from: string; to: string } {
  const from = new Date(year, monthIdx, 1);
  const to = new Date(year, monthIdx + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function fmtUSD(n: number): string {
  if (!isFinite(n)) return '$0';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtAZN(n: number): string {
  if (!isFinite(n)) return '0 ₼';
  return Math.round(n).toLocaleString('en-US') + ' ₼';
}

export function fmtNum(n: number): string {
  if (!isFinite(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}

export function fmtPct(n: number): string {
  if (!isFinite(n)) return '0.0%';
  return n.toFixed(1) + '%';
}

export function dailyLabels(from: string, to: string): string[] {
  const start = new Date(from);
  const end = new Date(to);
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(`${cur.getDate()} ${MONTHS_AZ_SHORT[cur.getMonth()]}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function monthlyLabels(from: string, to: string): string[] {
  const start = new Date(from);
  const end = new Date(to);
  const out: string[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    out.push(`${MONTHS_AZ_SHORT[cur.getMonth()]} ${cur.getFullYear()}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

export function aggregateToMonthly(daily: any[], from: string, to: string, sumKey: string): number[] {
  const labels = monthlyLabels(from, to);
  const out: number[] = labels.map(() => 0);
  for (const point of daily) {
    const d = new Date(point.date);
    const labelIdx = labels.findIndex(l => {
      const [mShort, y] = l.split(' ');
      return d.getMonth() === MONTHS_AZ_SHORT.indexOf(mShort) && d.getFullYear() === +y;
    });
    if (labelIdx >= 0) out[labelIdx] += Number(point[sumKey]) || 0;
  }
  return out;
}

export function dailyValues(daily: any[], from: string, to: string, sumKey: string): number[] {
  const labels = dailyLabels(from, to);
  const out: number[] = labels.map(() => 0);
  const dateMap = new Map<string, any>();
  for (const p of daily) dateMap.set(p.date, p);
  let i = 0;
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    const p = dateMap.get(key);
    out[i] = p ? Number(p[sumKey]) || 0 : 0;
    cur.setDate(cur.getDate() + 1);
    i++;
  }
  return out;
}

export const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#0d9488', '#0891b2'];

export const SOURCE_COLORS: Record<string, string> = {
  'WhatsApp': '#25D366', 'Whatsapp': '#25D366', 'whatsapp': '#25D366',
  'Instagram': '#E1306C', 'İnstagram': '#E1306C',
  'Facebook': '#1877F2',
  'Zəng': '#3b82f6', 'Telefon': '#3b82f6',
  'Klinikaya gələn': '#f59e0b',
  'Tövsiyə': '#8b5cf6',
  'GPT': '#0d9488',
  'Google': '#f59e0b',
  'Website': '#6366f1',
  'LinkedIn': '#0a66c2',
  'Tiktok': '#000000',
  'Email': '#ef4444',
};

export function sourceColor(name: string, fallback?: string): string {
  return SOURCE_COLORS[name] || fallback || '#64748b';
}
