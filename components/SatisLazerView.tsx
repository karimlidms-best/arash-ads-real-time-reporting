'use client';
import { useEffect, useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, LineElement, PointElement, LinearScale, CategoryScale, BarElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(ArcElement, LineElement, PointElement, LinearScale, CategoryScale, BarElement, Tooltip, Legend, Filler);
import GranularityToggle from './GranularityToggle';
import type { ClinicRecord } from '@/lib/types';
import { fmtAZN, fmtNum, dailyLabels, monthlyLabels, sourceColor } from './utils';

const DOCTORS = ['Fərhad Qarayev', 'Nigar Sadıqova', 'Zülfiyyə İskəndərova', 'Samirə Teymurova', 'Sevinc Rüstəmzadə', 'Leyla Zülfüqarova', 'Nazirə İbrahimova'];
const PROCEDURES = ['Lazer epilyasiya', 'Üzün təmizlənməsi', 'Tattoo silinməsi', 'Dermatoloji prosedurlar', 'Kosmetoloji prosedurlar'];
const SOURCES = ['Instagram', 'WhatsApp', 'Klinikaya gələn', 'Tövsiyə', 'Zəng', 'GPT', 'Google'];
const PROC_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

interface Props {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

export default function SatisLazerView({ from, to, onFromChange, onToChange }: Props) {
  const [records, setRecords] = useState<ClinicRecord[]>([]);
  const [doctor, setDoctor] = useState('all');
  const [procedure, setProcedure] = useState('all');
  const [source, setSource] = useState('all');
  const [dateValue, setDateValue] = useState('2026-05');
  const [chartGran, setChartGran] = useState<'day' | 'month'>('day');

  useEffect(() => {
    fetch(`/api/sheets/clinic?from=${from}&to=${to}`).then(r => r.json()).then(d => setRecords(d.records || []));
  }, [from, to]);

  function changeDateMonth(value: string) {
    setDateValue(value);
    if (value === 'custom') return;
    const [y, m] = value.split('-').map(Number);
    const fromDate = new Date(y, m - 1, 1);
    const toDate = new Date(y, m, 0);
    onFromChange(fromDate.toISOString().slice(0, 10));
    onToChange(toDate.toISOString().slice(0, 10));
  }

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (doctor !== 'all' && r.doctor !== doctor) return false;
      if (procedure !== 'all' && r.procedure !== procedure) return false;
      if (source !== 'all' && r.source !== source) return false;
      return true;
    });
  }, [records, doctor, procedure, source]);

  const totalRevenue = filtered.reduce((s, r) => s + r.amount, 0);
  const totalPatients = filtered.length;
  const avgAmount = totalPatients > 0 ? totalRevenue / totalPatients : 0;

  // Daily trend
  const dateRevenue = new Map<string, number>();
  for (const r of filtered) {
    dateRevenue.set(r.date, (dateRevenue.get(r.date) || 0) + r.amount);
  }
  const dailyArr = Array.from(dateRevenue.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));

  // Procedure breakdown
  const procCount = new Map<string, number>();
  for (const r of filtered) procCount.set(r.procedure, (procCount.get(r.procedure) || 0) + 1);
  const procData = PROCEDURES.map((p, i) => ({ name: p, count: procCount.get(p) || 0, color: PROC_COLORS[i] }));

  // Source breakdown
  const srcCount = new Map<string, number>();
  for (const r of filtered) srcCount.set(r.source, (srcCount.get(r.source) || 0) + 1);
  const srcData = SOURCES.map(s => ({ name: s, count: srcCount.get(s) || 0, color: sourceColor(s, '#94a3b8') }));

  // Doctor performance
  const docMap = new Map<string, { revenue: number; count: number }>();
  for (const r of filtered) {
    if (!docMap.has(r.doctor)) docMap.set(r.doctor, { revenue: 0, count: 0 });
    const x = docMap.get(r.doctor)!;
    x.revenue += r.amount;
    x.count++;
  }
  const docArr = Array.from(docMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // Recent 10
  const recent = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  // Chart data
  const labels = chartGran === 'day' ? dailyLabels(from, to) : monthlyLabels(from, to);
  const trendData = chartGran === 'day'
    ? (() => {
        const arr: number[] = [];
        const cur = new Date(from);
        const end = new Date(to);
        while (cur <= end) {
          const key = cur.toISOString().slice(0, 10);
          arr.push(dateRevenue.get(key) || 0);
          cur.setDate(cur.getDate() + 1);
        }
        return arr;
      })()
    : (() => {
        const monthMap = new Map<string, number>();
        for (const [date, val] of dateRevenue) {
          const [y, m] = date.split('-');
          const key = `${y}-${m}`;
          monthMap.set(key, (monthMap.get(key) || 0) + val);
        }
        const arr: number[] = [];
        const cur = new Date(from);
        const end = new Date(to);
        let curM = new Date(cur.getFullYear(), cur.getMonth(), 1);
        const endM = new Date(end.getFullYear(), end.getMonth(), 1);
        while (curM <= endM) {
          const key = `${curM.getFullYear()}-${String(curM.getMonth() + 1).padStart(2, '0')}`;
          arr.push(monthMap.get(key) || 0);
          curM.setMonth(curM.getMonth() + 1);
        }
        return arr;
      })();

  return (
    <div className="space-y-5">
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5 text-xs">
        <div className="h-7 w-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700"><Info className="w-4 h-4" /></div>
        <div className="text-rose-900"><span className="font-medium">Ekspert Lazer Mərkəzi</span> məlumatları Google Sheets-dən real-time çəkilir</div>
      </div>

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
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Həkim</label>
            <select value={doctor} onChange={(e) => setDoctor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="all">Hamısı</option>
              {DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Prosedur</label>
            <select value={procedure} onChange={(e) => setProcedure(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="all">Hamısı</option>
              {PROCEDURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Mənbə</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="all">Hamısı</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
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
        <div className="rounded-2xl p-5 border" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Ümumi Gəlir</div>
          <div className="text-4xl font-semibold tab-num" style={{ color: '#15803d' }}>{fmtAZN(totalRevenue)}</div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: '#fdf2f8', borderColor: '#fce7f3' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Pasient sayı</div>
          <div className="text-4xl font-semibold tab-num" style={{ color: '#be185d' }}>{fmtNum(totalPatients)}</div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: '#eff6ff', borderColor: '#dbeafe' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Orta prosedur məbləği</div>
          <div className="text-4xl font-semibold tab-num" style={{ color: '#1d4ed8' }}>{fmtAZN(avgAmount)}</div>
          <div className="text-xs mt-2 text-slate-500">Ümumi gəlir ÷ pasient sayı</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h3 className="font-semibold">Gəlir trendi</h3><p className="text-xs text-slate-500 mt-0.5">Seçilmiş dövr · {chartGran === 'day' ? 'günlük' : 'aylıq'}</p></div>
          <GranularityToggle value={chartGran} onChange={setChartGran} />
        </div>
        <div style={{ height: 260 }}>
          <Line data={{
            labels,
            datasets: [{ label: 'Gəlir (₼)', data: trendData, borderColor: '#15803d', backgroundColor: '#15803d20', fill: true, tension: 0.35, borderWidth: 2, pointRadius: chartGran === 'day' ? 2 : 4 }]
          }} options={{ responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, callbacks: { label: (c: any) => c.parsed.y + ' ₼' } } },
            scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', callback: (v: any) => v + ' ₼' } }, x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 12 } } }
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PieCard title="Prosedur üzrə bölgü" subtitle="Pasient sayı" data={procData} />
        <PieCard title="Mənbə üzrə bölgü" subtitle="Pasientlər hardan gəldi" data={srcData} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
        <div className="mb-4"><h3 className="font-semibold">Həkim üzrə performans</h3><p className="text-xs text-slate-500 mt-0.5">Gəlir və pasient sayı</p></div>
        <div style={{ height: 280 }}>
          <Bar data={{
            labels: docArr.map(d => d.name.split(' ').map((p, i) => i === 0 ? p : p[0] + '.').join(' ')),
            datasets: [
              { label: 'Gəlir (₼)', data: docArr.map(d => d.revenue), backgroundColor: '#15803d', borderRadius: 6, yAxisID: 'y' },
              { label: 'Pasient sayı', data: docArr.map(d => d.count), backgroundColor: '#ec4899', borderRadius: 6, yAxisID: 'y1' },
            ]
          }} options={{ responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 14 } }, tooltip: { backgroundColor: '#0f172a', padding: 10 } },
            scales: {
              y: { type: 'linear', position: 'left', beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', callback: (v: any) => v + ' ₼' } },
              y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { display: false }, ticks: { color: '#64748b' } },
              x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
          }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="p-5 pb-3"><h3 className="font-semibold">Son pasientlər</h3><p className="text-xs text-slate-500 mt-0.5">Google Sheets-dən son 10 yazı</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">№</th>
                <th className="text-left font-medium px-4 py-2.5">Tarix</th>
                <th className="text-left font-medium px-4 py-2.5">Həkim</th>
                <th className="text-left font-medium px-4 py-2.5">Pasient</th>
                <th className="text-left font-medium px-4 py-2.5">Əlaqə</th>
                <th className="text-left font-medium px-4 py-2.5">Prosedur</th>
                <th className="text-left font-medium px-4 py-2.5">Seans</th>
                <th className="text-left font-medium px-4 py-2.5">Mənbə</th>
                <th className="text-right font-medium px-4 py-2.5">Məbləğ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 tab-num">{r.num}</td>
                  <td className="px-4 py-3 text-slate-600">{r.date}</td>
                  <td className="px-4 py-3">{r.doctor}</td>
                  <td className="px-4 py-3 text-slate-600">{r.patient}</td>
                  <td className="px-4 py-3 text-slate-500 tab-num text-xs">{r.contact}</td>
                  <td className="px-4 py-3 text-slate-600">{r.procedure}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{r.seans}</td>
                  <td className="px-4 py-3"><SourceBadge source={r.source} /></td>
                  <td className="px-4 py-3 text-right font-semibold tab-num">{r.amount} ₼</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-sm text-slate-400">Data yoxdur</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PieCard({ title, subtitle, data }: any) {
  const total = data.reduce((s: number, d: any) => s + d.count, 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
      <div className="mb-4"><h3 className="font-semibold">{title}</h3><p className="text-xs text-slate-500 mt-0.5">{subtitle}</p></div>
      <div style={{ height: 280 }}>
        {total > 0 ? (
          <Doughnut data={{ labels: data.map((d: any) => d.name), datasets: [{ data: data.map((d: any) => d.count), backgroundColor: data.map((d: any) => d.color), borderColor: '#fff', borderWidth: 2 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, cutout: '55%',
                               plugins: { legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 12, font: { size: 11 } } }, tooltip: { backgroundColor: '#0f172a', padding: 10 } } }} />
        ) : <div className="h-full flex items-center justify-center text-sm text-slate-400">Data yoxdur</div>}
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    'WhatsApp': 'bg-green-100 text-green-700',
    'Instagram': 'bg-pink-100 text-pink-700',
    'Zəng': 'bg-blue-100 text-blue-700',
    'Klinikaya gələn': 'bg-amber-100 text-amber-700',
    'Tövsiyə': 'bg-violet-100 text-violet-700',
    'GPT': 'bg-teal-100 text-teal-700',
    'Google': 'bg-orange-100 text-orange-700',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[source] || 'bg-slate-100 text-slate-700'}`}>{source}</span>;
}
