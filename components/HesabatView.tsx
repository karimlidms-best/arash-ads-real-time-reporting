'use client';
import { useEffect, useState } from 'react';
import { DollarSign, Eye, BarChart3, MessageSquare, Users, Megaphone, Repeat, MessageCircleMore, UserCheck, TrendingUp, UserRound, MousePointerClick } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import KpiCard from './KpiCard';
import GranularityToggle from './GranularityToggle';
import { DEPTS } from '@/lib/types';
import type { Dept, HesabatMetrics, DailyPoint, DeptBreakdown } from '@/lib/types';
import { fmtUSD, fmtNum, fmtPct, dailyLabels, monthlyLabels, dailyValues, aggregateToMonthly, PIE_COLORS } from './utils';

ChartJS.register(ArcElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const EKSPERT_TOOLTIP = 'Bu rəqəm dəqiq deyil — Lead qeydiyyatı aparılmadığı üçün təxmini göstərilir';

interface Props {
  dept: Dept;
  from: string;
  to: string;
  platform: string;
  adset: string;
  onPlatformChange: (v: string) => void;
  onAdsetChange: (v: string) => void;
}

interface InsightsResponse {
  totals: HesabatMetrics;
  daily: DailyPoint[];
  deptBreakdown: DeptBreakdown[];
}

export default function HesabatView({ dept, from, to, platform, adset, onPlatformChange, onAdsetChange }: Props) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [adsets, setAdsets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [chart1Gran, setChart1Gran] = useState<'day' | 'month'>('day');
  const [chart2Gran, setChart2Gran] = useState<'day' | 'month'>('day');

  const cfg = DEPTS[dept];
  const isEkspert = cfg.layout === 'ekspert';
  const isPodcast = cfg.layout === 'podcast';
  const showDeptPie = cfg.isAggArash || cfg.isAggEkspert;

  useEffect(() => {
    setLoading(true);
    const url = `/api/meta/insights?dept=${dept}&from=${from}&to=${to}&platform=${platform}&adset=${encodeURIComponent(adset)}`;
    fetch(url).then(r => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [dept, from, to, platform, adset]);

  useEffect(() => {
    fetch(`/api/meta/adsets?dept=${dept}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then(d => setAdsets(d.adsets || []))
      .catch(() => setAdsets([]));
  }, [dept, from, to]);

  const totals = data?.totals || { spend: 0, reach: 0, impressions: 0, messages: 0, leads: 0, cpm: 0, frequency: 0, costPerMessage: 0, costPerLead: 0, msgToLead: 0 };

  return (
    <div className="space-y-5">
      {/* Filter row */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Ad Set:</label>
          <select value={adset} onChange={(e) => onAdsetChange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none cursor-pointer min-w-[180px]">
            <option value="all">Hamısı</option>
            {adsets.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Platform:</label>
          <select value={platform} onChange={(e) => onPlatformChange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none cursor-pointer">
            <option value="all">Hamısı</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      {!isPodcast ? <DefaultMetrics totals={totals} isEkspert={isEkspert} /> : <PodcastMetrics totals={totals} />}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{isPodcast ? 'CPM və Frequency' : (isEkspert ? 'Mesaj sayı' : 'Mesaj və Lead sayı')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Seçilmiş dövr · {chart1Gran === 'day' ? 'günlük' : 'aylıq'}</p>
            </div>
            <GranularityToggle value={chart1Gran} onChange={setChart1Gran} />
          </div>
          <div style={{ height: 260 }}>
            <Chart1 data={data} from={from} to={to} gran={chart1Gran} isPodcast={isPodcast} isEkspert={isEkspert} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{isPodcast ? 'Reach və Impression' : (isEkspert ? 'Mesaj başına xərc' : 'Mesaj və Lead başına xərc')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Seçilmiş dövr · {chart2Gran === 'day' ? 'günlük' : 'aylıq'}</p>
            </div>
            <GranularityToggle value={chart2Gran} onChange={setChart2Gran} />
          </div>
          <div style={{ height: 260 }}>
            <Chart2 data={data} from={from} to={to} gran={chart2Gran} isPodcast={isPodcast} isEkspert={isEkspert} />
          </div>
        </div>
      </div>

      {/* Dept Pie */}
      {showDeptPie && <DeptPie data={data} isEkspertAgg={cfg.isAggEkspert || false} />}
    </div>
  );
}

function DefaultMetrics({ totals, isEkspert }: { totals: HesabatMetrics; isEkspert: boolean }) {
  const leadValue = isEkspert ? `<${fmtNum(totals.messages)}` : fmtNum(totals.leads);
  const cpleadValue = isEkspert ? `>${fmtUSD(totals.costPerMessage)}` : fmtUSD(totals.costPerLead);
  const convValue = isEkspert ? 'No info' : fmtPct(totals.msgToLead);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={DollarSign} iconBg="#dbeafe" iconColor="#2563eb" label="Ümumi Xərc" value={fmtUSD(totals.spend)} sublabel="Seçilmiş dövr" />
        <KpiCard icon={Eye} iconBg="#fed7aa" iconColor="#ea580c" label="Əhatə" value={fmtNum(totals.reach)} sublabel="Unikal insan sayı" />
        <KpiCard icon={BarChart3} iconBg="#d1fae5" iconColor="#059669" label="Impression" value={fmtNum(totals.impressions)} sublabel="Ümumi göstərilmə" />
        <KpiCard icon={MessageSquare} iconBg="#fce7f3" iconColor="#db2777" label="Mesaj sayı" value={fmtNum(totals.messages)} sublabel="Reklamdan başlanan söhbət" />
        <KpiCard icon={Users} iconBg="#e0e7ff" iconColor="#4f46e5" label="Lead sayı" value={leadValue}
                 sublabel={isEkspert ? 'Mesaj sayından az' : 'Odoo CRM-dən'} tooltip={isEkspert ? EKSPERT_TOOLTIP : undefined} muted={isEkspert} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Megaphone} iconBg="#ede9fe" iconColor="#7c3aed" label="CPM" value={fmtUSD(totals.cpm)} sublabel="1000 göstərilmə başına" />
        <KpiCard icon={Repeat} iconBg="#fee2e2" iconColor="#dc2626" label="Frequency" value={totals.frequency.toFixed(2)} sublabel="Ortalama göstərilmə" />
        <KpiCard icon={MessageCircleMore} iconBg="#cffafe" iconColor="#0891b2" label="Mesaj başına xərc" value={fmtUSD(totals.costPerMessage)} sublabel="Xərc ÷ mesaj sayı" />
        <KpiCard icon={UserCheck} iconBg="#ccfbf1" iconColor="#0d9488" label="Lead başına xərc" value={cpleadValue}
                 sublabel={isEkspert ? 'Mesaj başına xərcdən baha' : 'Xərc ÷ Odoo lead'} tooltip={isEkspert ? EKSPERT_TOOLTIP : undefined} muted={isEkspert} />
        <KpiCard icon={TrendingUp} iconBg="#dcfce7" iconColor="#16a34a" label="Mesaj → Lead" value={convValue}
                 sublabel={isEkspert ? 'Lead qeydiyyatı aparılmır' : 'Lead ÷ mesaj × 100'} tooltip={isEkspert ? EKSPERT_TOOLTIP : undefined} muted={isEkspert} />
      </div>
    </div>
  );
}

function PodcastMetrics({ totals }: { totals: HesabatMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} iconBg="#dbeafe" iconColor="#2563eb" label="Ümumi Xərc" value={fmtUSD(totals.spend)} sublabel="Seçilmiş dövr" />
        <KpiCard icon={Eye} iconBg="#fed7aa" iconColor="#ea580c" label="Əhatə" value={fmtNum(totals.reach)} sublabel="Unikal insan sayı" />
        <KpiCard icon={BarChart3} iconBg="#d1fae5" iconColor="#059669" label="Impression" value={fmtNum(totals.impressions)} sublabel="Ümumi göstərilmə" />
        <KpiCard icon={UserRound} iconBg="#e0e7ff" iconColor="#4f46e5" label="Visit Profile" value={fmtNum(totals.profileVisits || 0)} sublabel="Profil ziyarəti sayı" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <KpiCard icon={MousePointerClick} iconBg="#cffafe" iconColor="#0891b2" label="Clicks" value={fmtNum(totals.clicks || 0)} sublabel="Ümumi klik sayı" />
        <KpiCard icon={Megaphone} iconBg="#ede9fe" iconColor="#7c3aed" label="CPM" value={fmtUSD(totals.cpm)} sublabel="1000 göstərilmə başına" />
        <KpiCard icon={Repeat} iconBg="#fee2e2" iconColor="#dc2626" label="Frequency" value={totals.frequency.toFixed(2)} sublabel="Ortalama göstərilmə" />
      </div>
    </div>
  );
}

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, align: 'end' as const, labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 14 } }, tooltip: { backgroundColor: '#0f172a', padding: 10 } },
  scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#64748b' } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 12 } } },
};

function Chart1({ data, from, to, gran, isPodcast, isEkspert }: any) {
  const labels = gran === 'day' ? dailyLabels(from, to) : monthlyLabels(from, to);
  const daily = data?.daily || [];

  if (isPodcast) {
    const cpm = gran === 'day' ? dailyValues(daily, from, to, 'spend').map((s, i) => {
      const impr = dailyValues(daily, from, to, 'impressions')[i];
      return impr > 0 ? (s / impr) * 1000 : 0;
    }) : [];
    const freq = gran === 'day' ? dailyValues(daily, from, to, 'impressions').map((i, idx) => {
      const r = dailyValues(daily, from, to, 'reach')[idx];
      return r > 0 ? i / r : 0;
    }) : [];
    return <Line data={{
      labels,
      datasets: [
        { label: 'CPM ($)', data: cpm, borderColor: '#7c3aed', backgroundColor: '#7c3aed20', fill: true, tension: 0.35, borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4, yAxisID: 'y' },
        { label: 'Frequency', data: freq, borderColor: '#dc2626', borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4, yAxisID: 'y1', fill: false, tension: 0.35 },
      ]
    }} options={{ ...CHART_OPTS, scales: { y: { type: 'linear', position: 'left', beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } }, y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { display: false }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 12 } } } }} />;
  }

  const msg = gran === 'day' ? dailyValues(daily, from, to, 'messages') : aggregateToMonthly(daily, from, to, 'messages');
  const datasets: any[] = [
    { label: 'Mesaj sayı', data: msg, borderColor: '#db2777', backgroundColor: '#db277720', fill: true, tension: 0.35, borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4 },
  ];
  if (!isEkspert) {
    const lead = gran === 'day' ? dailyValues(daily, from, to, 'leads') : aggregateToMonthly(daily, from, to, 'leads');
    datasets.push({ label: 'Lead sayı (Odoo)', data: lead, borderColor: '#4f46e5', backgroundColor: '#4f46e520', fill: true, tension: 0.35, borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4 });
  }
  return <Line data={{ labels, datasets }} options={CHART_OPTS} />;
}

function Chart2({ data, from, to, gran, isPodcast, isEkspert }: any) {
  const labels = gran === 'day' ? dailyLabels(from, to) : monthlyLabels(from, to);
  const daily = data?.daily || [];

  if (isPodcast) {
    const reach = gran === 'day' ? dailyValues(daily, from, to, 'reach') : aggregateToMonthly(daily, from, to, 'reach');
    const impr = gran === 'day' ? dailyValues(daily, from, to, 'impressions') : aggregateToMonthly(daily, from, to, 'impressions');
    return <Line data={{
      labels,
      datasets: [
        { label: 'Reach', data: reach, borderColor: '#ea580c', backgroundColor: '#ea580c20', fill: true, tension: 0.35, borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4 },
        { label: 'Impression', data: impr, borderColor: '#059669', backgroundColor: '#05966920', fill: true, tension: 0.35, borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4 },
      ]
    }} options={CHART_OPTS} />;
  }

  // Cost per message daily
  const spendArr = gran === 'day' ? dailyValues(daily, from, to, 'spend') : aggregateToMonthly(daily, from, to, 'spend');
  const msgArr = gran === 'day' ? dailyValues(daily, from, to, 'messages') : aggregateToMonthly(daily, from, to, 'messages');
  const cpmsg = spendArr.map((s, i) => msgArr[i] > 0 ? s / msgArr[i] : 0);
  const datasets: any[] = [
    { label: 'Mesaj başına xərc ($)', data: cpmsg, borderColor: '#0891b2', backgroundColor: '#0891b220', fill: true, tension: 0.35, borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4 },
  ];
  if (!isEkspert) {
    const leadArr = gran === 'day' ? dailyValues(daily, from, to, 'leads') : aggregateToMonthly(daily, from, to, 'leads');
    const cplead = spendArr.map((s, i) => leadArr[i] > 0 ? s / leadArr[i] : 0);
    datasets.push({ label: 'Lead başına xərc ($)', data: cplead, borderColor: '#0d9488', backgroundColor: '#0d948820', fill: true, tension: 0.35, borderWidth: 2, pointRadius: gran === 'day' ? 2 : 4 });
  }
  return <Line data={{ labels, datasets }} options={{ ...CHART_OPTS, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#64748b', callback: (v: any) => '$' + v } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 12 } } } }} />;
}

function DeptPie({ data, isEkspertAgg }: any) {
  const breakdown = data?.deptBreakdown || [];
  const total = breakdown.reduce((s: number, d: any) => s + d.leads, 0);
  const labels = breakdown.map((d: any) => DEPTS[d.dept as Dept].name);
  const values = breakdown.map((d: any) => d.leads);
  const colors = PIE_COLORS.slice(0, breakdown.length);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="font-semibold">{isEkspertAgg ? 'Mesaj bölgüsü şöbələr üzrə' : 'Lead bölgüsü şöbələr üzrə'}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{isEkspertAgg ? 'Lazer Mərkəzi və Akademiya' : 'Hansı şöbədən neçə lead gəlib · Ekspert şöbələr nəzərə alınmır'}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div style={{ height: 280 }}>
          <Doughnut data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, cutout: '55%',
                               plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, callbacks: { label: (c: any) => { const pct = total > 0 ? Math.round((c.parsed / total) * 100) : 0; return `${c.label}: ${c.parsed} (${pct}%)`; } } } } }} />
        </div>
        <div className="space-y-4">
          {breakdown.map((d: any, i: number) => {
            const pct = total > 0 ? Math.round((d.leads / total) * 100) : 0;
            const color = colors[i];
            return (
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-sm">{DEPTS[d.dept as Dept].name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold tab-num">{d.leads}</span>
                    <span className="text-slate-400 tab-num">{pct}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
