'use client';
import { useEffect, useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import GranularityToggle from './GranularityToggle';
import type { AcademyRecord } from '@/lib/types';
import { fmtAZN, fmtNum, dailyLabels, monthlyLabels } from './utils';

interface Props {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

export default function SatisAkademiyaView({ from, to, onFromChange, onToChange }: Props) {
  const [allRecords, setAllRecords] = useState<AcademyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AcademyRecord[]>([]);
  const [status, setStatus] = useState('all');
  const [dateValue, setDateValue] = useState('2026-05');
  const [regGran, setRegGran] = useState<'day' | 'month'>('day');
  const [revGran, setRevGran] = useState<'day' | 'month'>('day');

  useEffect(() => {
    fetch(`/api/sheets/academy?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(d => { setAllRecords(d.all || []); setFilteredRecords(d.filtered || []); });
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

  const filteredByStatus = useMemo(() => {
    if (status === 'all') return filteredRecords;
    return filteredRecords.filter(r => r.status === status);
  }, [filteredRecords, status]);

  const allByStatus = useMemo(() => {
    if (status === 'all') return allRecords;
    return allRecords.filter(r => r.status === status);
  }, [allRecords, status]);

  const totalStudents = allRecords.length;
  const activeStudents = allRecords.filter(r => r.status === 'Aktiv').length;
  const filteredRegCount = filteredByStatus.length;
  const filteredRevenue = filteredByStatus.reduce((s, r) => s + r.payment, 0);

  // Status pie (all)
  const statusCounts = { 'Aktiv': 0, 'Bitmiş': 0, 'Başlamayıb': 0 };
  for (const r of allRecords) statusCounts[r.status]++;

  // Recent 10
  const recent = [...allByStatus].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)).slice(0, 10);

  // Trend (registrations + revenue)
  const dateRegMap = new Map<string, number>();
  const dateRevMap = new Map<string, number>();
  for (const r of filteredByStatus) {
    dateRegMap.set(r.registeredAt, (dateRegMap.get(r.registeredAt) || 0) + 1);
    dateRevMap.set(r.registeredAt, (dateRevMap.get(r.registeredAt) || 0) + r.payment);
  }

  function genTrendData(gran: 'day' | 'month', map: Map<string, number>): number[] {
    const labels = gran === 'day' ? dailyLabels(from, to) : monthlyLabels(from, to);
    if (gran === 'day') {
      const arr: number[] = [];
      const cur = new Date(from);
      const end = new Date(to);
      while (cur <= end) {
        const key = cur.toISOString().slice(0, 10);
        arr.push(map.get(key) || 0);
        cur.setDate(cur.getDate() + 1);
      }
      return arr;
    } else {
      const monthMap = new Map<string, number>();
      for (const [date, val] of map) {
        const [y, m] = date.split('-');
        monthMap.set(`${y}-${m}`, (monthMap.get(`${y}-${m}`) || 0) + val);
      }
      const arr: number[] = [];
      let curM = new Date(new Date(from).getFullYear(), new Date(from).getMonth(), 1);
      const endM = new Date(new Date(to).getFullYear(), new Date(to).getMonth(), 1);
      while (curM <= endM) {
        const key = `${curM.getFullYear()}-${String(curM.getMonth() + 1).padStart(2, '0')}`;
        arr.push(monthMap.get(key) || 0);
        curM.setMonth(curM.getMonth() + 1);
      }
      return arr;
    }
  }

  const regLabels = regGran === 'day' ? dailyLabels(from, to) : monthlyLabels(from, to);
  const revLabels = revGran === 'day' ? dailyLabels(from, to) : monthlyLabels(from, to);
  const regData = genTrendData(regGran, dateRegMap);
  const revData = genTrendData(revGran, dateRevMap);

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-2.5 text-xs">
        <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700"><Info className="w-4 h-4" /></div>
        <div className="text-indigo-900"><span className="font-medium">Ekspert Akademiya</span> məlumatları ayrıca Google Sheets-dən real-time çəkilir</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
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
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer">
              <option value="all">Hamısı</option>
              <option value="Aktiv">Aktiv</option>
              <option value="Bitmiş">Bitmiş</option>
              <option value="Başlamayıb">Başlamayıb</option>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 border" style={{ background: '#eef2ff', borderColor: '#e0e7ff' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Ümumi tələbə sayı</div>
          <div className="text-3xl font-semibold tab-num" style={{ color: '#4338ca' }}>{fmtNum(totalStudents)}</div>
          <div className="text-xs mt-2 text-slate-500">Bütün dövr · filtersiz</div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Hazırda aktiv tələbə</div>
          <div className="text-3xl font-semibold tab-num" style={{ color: '#15803d' }}>{fmtNum(activeStudents)}</div>
          <div className="text-xs mt-2 text-slate-500">Bugün dərsdə</div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: '#fdf2f8', borderColor: '#fce7f3' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Qeydiyyata alınmış tələbə sayı</div>
          <div className="text-3xl font-semibold tab-num" style={{ color: '#be185d' }}>{fmtNum(filteredRegCount)}</div>
          <div className="text-xs mt-2 text-slate-500">Filterdə</div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="text-xs font-medium text-slate-600 mb-1">Gözlənilən Gəlir</div>
          <div className="text-3xl font-semibold tab-num" style={{ color: '#b45309' }}>{fmtAZN(filteredRevenue)}</div>
          <div className="text-xs mt-2 text-slate-500">Filterdə</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h3 className="font-semibold">Qeydiyyat trendi</h3><p className="text-xs text-slate-500 mt-0.5">Seçilmiş dövr · {regGran === 'day' ? 'günlük' : 'aylıq'}</p></div>
            <GranularityToggle value={regGran} onChange={setRegGran} />
          </div>
          <div style={{ height: 260 }}>
            <Line data={{
              labels: regLabels,
              datasets: [{ label: 'Qeydiyyat', data: regData, borderColor: '#4338ca', backgroundColor: '#4338ca20', fill: true, tension: 0.35, borderWidth: 2, pointRadius: regGran === 'day' ? 2 : 4 }]
            }} options={{ responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10 } },
              scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 12 } } }
            }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h3 className="font-semibold">Gəlir trendi</h3><p className="text-xs text-slate-500 mt-0.5">Seçilmiş dövr · {revGran === 'day' ? 'günlük' : 'aylıq'} (₼)</p></div>
            <GranularityToggle value={revGran} onChange={setRevGran} />
          </div>
          <div style={{ height: 260 }}>
            <Line data={{
              labels: revLabels,
              datasets: [{ label: 'Gəlir (₼)', data: revData, borderColor: '#15803d', backgroundColor: '#15803d20', fill: true, tension: 0.35, borderWidth: 2, pointRadius: revGran === 'day' ? 2 : 4 }]
            }} options={{ responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, callbacks: { label: (c: any) => c.parsed.y + ' ₼' } } },
              scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', callback: (v: any) => v + ' ₼' } }, x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 12 } } }
            }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
        <div className="mb-4"><h3 className="font-semibold">Status bölgüsü</h3><p className="text-xs text-slate-500 mt-0.5">Aktiv, bitmiş və başlamayıb tələbələrin nisbəti</p></div>
        <div style={{ height: 280 }}>
          <Doughnut data={{
            labels: ['Aktiv', 'Bitmiş', 'Başlamayıb'],
            datasets: [{ data: [statusCounts.Aktiv, statusCounts.Bitmiş, statusCounts.Başlamayıb], backgroundColor: ['#10b981', '#64748b', '#f59e0b'], borderColor: '#fff', borderWidth: 2 }]
          }} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 12, font: { size: 12 } } }, tooltip: { backgroundColor: '#0f172a', padding: 10 } }
          }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="p-5 pb-3"><h3 className="font-semibold">Son qeydiyyatdan keçən tələbələr</h3><p className="text-xs text-slate-500 mt-0.5">Sheets-dən son 10 yazı</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">№</th>
                <th className="text-left font-medium px-4 py-2.5">Tələbə</th>
                <th className="text-left font-medium px-4 py-2.5">Əlaqə</th>
                <th className="text-left font-medium px-4 py-2.5">Qeydiyyat</th>
                <th className="text-left font-medium px-4 py-2.5">Tədris başladı</th>
                <th className="text-left font-medium px-4 py-2.5">Tədris bitdi</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-right font-medium px-4 py-2.5">Ödəniş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 tab-num">{r.num}</td>
                  <td className="px-4 py-3 font-medium">{r.student}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs tab-num">{r.contact}</td>
                  <td className="px-4 py-3 text-slate-600">{r.registeredAt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.startsAt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.endsAt}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold tab-num">{r.payment} ₼</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">Data yoxdur</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    'Aktiv': 'bg-green-100 text-green-700',
    'Bitmiş': 'bg-slate-200 text-slate-700',
    'Başlamayıb': 'bg-amber-100 text-amber-700',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls[status]}`}>{status}</span>;
}
