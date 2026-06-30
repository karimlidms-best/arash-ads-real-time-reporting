'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HesabatView from '@/components/HesabatView';
import SatisOdooView from '@/components/SatisOdooView';
import SatisLazerView from '@/components/SatisLazerView';
import SatisAkademiyaView from '@/components/SatisAkademiyaView';
import SatisHamisiEkspertView from '@/components/SatisHamisiEkspertView';
import type { Dept } from '@/lib/types';
import { DEPTS } from '@/lib/types';
import { MONTHS_AZ, fmtDate } from '@/components/utils';

export default function Dashboard() {
  const [tab, setTab] = useState<'hesabat' | 'satis'>('hesabat');
  const [dept, setDept] = useState<Dept>('hamisi-arash');

  // Hesabat dates
  const [hesabatDateValue, setHesabatDateValue] = useState('2026-05');
  const [hesabatFrom, setHesabatFrom] = useState('2026-05-01');
  const [hesabatTo, setHesabatTo] = useState('2026-05-31');

  // Satis dates (Odoo / Lazer / Akademiya / HamisiEkspert share one set)
  const [satisFrom, setSatisFrom] = useState('2026-05-01');
  const [satisTo, setSatisTo] = useState('2026-05-31');

  const [platform, setPlatform] = useState('all');
  const [adset, setAdset] = useState('all');

  useEffect(() => {
    if (hesabatDateValue === 'custom') return;
    const [y, m] = hesabatDateValue.split('-').map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0);
    setHesabatFrom(from.toISOString().slice(0, 10));
    setHesabatTo(to.toISOString().slice(0, 10));
  }, [hesabatDateValue]);

  // Reset adset when dept changes
  useEffect(() => { setAdset('all'); }, [dept]);

  const cfg = DEPTS[dept];

  // Page title/subtitle
  const dateLabel = (() => {
    if (tab !== 'hesabat') return hesabatDateValue === 'custom' ? `${fmtDate(hesabatFrom)} – ${fmtDate(hesabatTo)}` : (() => {
      const [y, m] = hesabatDateValue.split('-').map(Number);
      return `${MONTHS_AZ[m - 1]} ${y}`;
    })();
    if (hesabatDateValue === 'custom') return `${fmtDate(hesabatFrom)} – ${fmtDate(hesabatTo)}`;
    const [y, m] = hesabatDateValue.split('-').map(Number);
    return `${MONTHS_AZ[m - 1]} ${y}`;
  })();
  const platSuffix = (tab === 'hesabat' && platform !== 'all') ? ` · ${platform === 'facebook' ? 'Facebook' : 'Instagram'}` : '';
  const adsetSuffix = (tab === 'hesabat' && adset !== 'all') ? ` · Ad Set: ${adset}` : '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        dept={dept}
        onDeptChange={(d) => setDept(d as Dept)}
        dateValue={hesabatDateValue}
        dateFrom={hesabatFrom}
        dateTo={hesabatTo}
        onDateValueChange={setHesabatDateValue}
        onDateFromChange={setHesabatFrom}
        onDateToChange={setHesabatTo}
        showDate={tab === 'hesabat'}
      />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-5 w-full">
        <div className="grid grid-cols-2 bg-slate-100/70 rounded-2xl p-1 gap-1">
          <button onClick={() => setTab('hesabat')}
                  className={`py-2.5 rounded-xl text-sm font-medium transition ${tab === 'hesabat' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
            Hesabat
          </button>
          <button onClick={() => setTab('satis')}
                  className={`py-2.5 rounded-xl text-sm font-medium transition ${tab === 'satis' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
            Satış
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-2 w-full">
        <h1 className="text-2xl font-semibold">{tab === 'hesabat' ? 'Hesabat' : 'Satış'}</h1>
        <div className="text-xs text-slate-500 mt-0.5">{dateLabel} · {cfg.name}{platSuffix}{adsetSuffix}</div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 pb-12 w-full flex-1">
        {tab === 'hesabat' && (
          <HesabatView dept={dept} from={hesabatFrom} to={hesabatTo}
                       platform={platform} adset={adset}
                       onPlatformChange={setPlatform} onAdsetChange={setAdset} />
        )}

        {tab === 'satis' && cfg.satisLayout === 'odoo' && (
          <SatisOdooView dept={dept} from={satisFrom} to={satisTo}
                         onFromChange={setSatisFrom} onToChange={setSatisTo} />
        )}
        {tab === 'satis' && cfg.satisLayout === 'lazer' && (
          <SatisLazerView from={satisFrom} to={satisTo}
                          onFromChange={setSatisFrom} onToChange={setSatisTo} />
        )}
        {tab === 'satis' && cfg.satisLayout === 'akademiya' && (
          <SatisAkademiyaView from={satisFrom} to={satisTo}
                              onFromChange={setSatisFrom} onToChange={setSatisTo} />
        )}
        {tab === 'satis' && cfg.satisLayout === 'hamisi-ekspert' && (
          <SatisHamisiEkspertView from={satisFrom} to={satisTo}
                                  onFromChange={setSatisFrom} onToChange={setSatisTo} />
        )}
      </div>

      <div className="border-t border-slate-200/70 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 text-center">
          <p className="text-xs text-slate-500">
            Bu hesabat rəqəmsal marketinq mütəxəssisi{' '}
            <a href="https://www.linkedin.com/in/karimdms/" target="_blank" className="text-blue-600 hover:underline font-medium">Karim Karimli</a>
            {' '}tərəfindən yaradılmışdır
          </p>
        </div>
      </div>
    </div>
  );
}
