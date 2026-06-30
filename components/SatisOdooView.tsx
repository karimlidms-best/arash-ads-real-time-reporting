'use client';
import { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import GranularityToggle from './GranularityToggle';
import type { Dept } from '@/lib/types';
import { fmtUSD, fmtNum, fmtPct, dailyLabels, monthlyLabels, dailyValues, aggregateToMonthly, PIE_COLORS } from './utils';

interface Props {
  dept: Dept;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

interface FilterLists {
  tags: string[];
  sources: string[];
  campaigns: string[];
}

export default function SatisOdooView({ dept, from, to, onFromChange, onToChange }: Props) {
  const [lists, setLists] = useState<FilterLists>({ tags: [], sources: [], campaigns: [] });
  const [tag, setTag] = useState('all');
  const [campaign, setCampaign] = useState('all');
  const [source, setSource] = useState('all');
  const [data, setData] = useState<any>(null);
  const [chartGran, setChartGran] = useState<'day' | 'month'>('day');
  const [dateValue, setDateValue] = useState('2026-05');

  useEffect(() => {
    fetch('/api/odoo/tags').then(r => r.json()).then(setLists).catch(() => {});
  }, []);

  useEffect(() => {
    const url = `/api/odoo/satis?dept=${dept}&from=${from}&to=${to}&tag=${encodeURIComponent(tag)}&campaign=${encodeURIComponent(campaign)}&source=${encodeURIComponent(source)}`;
    fetch(url).then(r => r.json()).then(setData).catch(() => setData(null));
  }, [dept, from, to, tag, campaign, source]);

  function changeDateMonth(value: string) {
    setDateValue(value);
    if (value === 'custom') return;
    const [y, m] = value.split('-').map(Number);
    const fromDate = new Date(y, m - 1, 1);
    const toDate = new Date(y, m, 0);
    onFromChange(fromDate.toISOString().slice(0, 10));
    onToChange(toDate.toISOString().slice(0, 10));
  }

  const labels = chartGran === 'day' ? dailyLabels(from, to) : monthlyLabels(from, to);
  const daily = data?.dailyLeads || [];
  const totalData = chartGran === 'day' ? dailyValues(daily, from, to, 'total') : aggregateToMonthly(daily, from, to, 'total');
  const wonData = chartGran === 'day' ? dailyValues(daily, from, to, 'won') : aggregateToMonthly(daily, from, to, 'won');

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Tarix</label>
            <select value={dateValue} onChange={(e) => changeDateMonth(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="2026-05">May 2026</option>
              <option value="2026-04">Aprel 2026</option>
              <option value="2026-03">Mart 2026</option>
              <option value="2026-02">Fevral 2026</option>
              <option value="2026-01">Yanvar 2026</option>
              <option value="custom">Tarix aralığı seç</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Tags</label>
            <select value={tag} onChange={(e) => setTag(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="all">Hamısı</option>
              {lists.tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Campaign</label>
            <select value={campaign} onChange={(e) => setCampaign(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="all">Hamısı</option>
              {lists.campaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="all">Hamısı</option>
              {lists.sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {dateValue === 'custom' && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Diapazon:</span>
              <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)}
                     className="rounded-lg border border-slate-200 bg-white text-sm px-3 py-1.5 outline-none" />
              <span className="text-slate-400">→</span>
              <input type="date" value={to} onChange={(e) => onToChange(e.target.value)}
                     className="rounded-lg border border-slate-200 bg-white text-sm px-3 py-1.5 outline-none" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 border" style={{ background: '#eff6ff', borderColor: '#dbeafe' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Close Rate</div>
          <div className="text-4xl font-semibold tab-num" style={{ color: '#1d4ed8' }}>{fmtPct(data?.closeRate || 0)}</div>
          <div className="text-xs mt-2 text-slate-500">{data?.wonCount || 0} won / {data?.totalOpps || 0} opps</div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Sales Revenue From Digital</div>
          <div className="text-4xl font-semibold tab-num" style={{ color: '#15803d' }}>{fmtUSD(data?.revenue || 0)}</div>
          <div className="text-xs mt-2 text-slate-500">Odoo expected_revenue</div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Open Opportunities</div>
          <div className="text-4xl font-semibold tab-num" style={{ color: '#b45309' }}>{fmtNum(data?.openOpportunities || 0)}</div>
          <div className="text-xs mt-2 text-slate-500">Aktiv pipeline</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Total leads və Won</h3>
            <p className="text-xs text-slate-500 mt-0.5">Seçilmiş dövr · {chartGran === 'day' ? 'günlük' : 'aylıq'}</p>
          </div>
          <GranularityToggle value={chartGran} onChange={setChartGran} />
        </div>
        <div style={{ height: 280 }}>
          <Line data={{
            labels,
            datasets: [
              { label: 'Total leads', data: totalData, borderColor: '#4f46e5', backgroundColor: '#4f46e520', fill: true, tension: 0.35, borderWidth: 2, pointRadius: chartGran === 'day' ? 2 : 4 },
              { label: 'Won', data: wonData, borderColor: '#10b981', backgroundColor: '#10b98120', fill: true, tension: 0.35, borderWidth: 2, pointRadius: chartGran === 'day' ? 2 : 4 },
            ]
          }} options={{ responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 14 } }, tooltip: { backgroundColor: '#0f172a', padding: 10 } },
            scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 12 } } }
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PieCard title="Sources" subtitle="Lead-lərin mənbə bölgüsü" data={data?.sourceBreakdown || []} />
        <PieCard title="Tags" subtitle="Lead-lərin etiket bölgüsü" data={data?.tagBreakdown || []} />
      </div>
    </div>
  );
}

function PieCard({ title, subtitle, data }: any) {
  const labels = data.map((d: any) => d.name);
  const values = data.map((d: any) => d.count);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
      <div className="mb-4"><h3 className="font-semibold">{title}</h3><p className="text-xs text-slate-500 mt-0.5">{subtitle}</p></div>
      <div style={{ height: 240 }}>
        {data.length > 0 ? (
          <Doughnut data={{ labels, datasets: [{ data: values, backgroundColor: PIE_COLORS.slice(0, data.length), borderColor: '#fff', borderWidth: 2 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, cutout: '55%',
                               plugins: { legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 12, font: { size: 12 } } }, tooltip: { backgroundColor: '#0f172a', padding: 10 } } }} />
        ) : <div className="h-full flex items-center justify-center text-sm text-slate-400">Data yoxdur</div>}
      </div>
    </div>
  );
}
