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
import { type DateOption, dateRangeFromOption, formatDateRangeLabel } from '@/components/utils';

export default function Dashboard() {
  const [tab, setTab] = useState<'hesabat' | 'satis'>('hesabat');
  const [dept, setDept] = useState<Dept>('hamisi-arash');

  // Hesabat dates
  const [dateOption, setDateOption] = useState<DateOption>('this-month');
  const initialRange = dateRangeFromOption('this-month');
  const [hesabatFrom, setHesabatFrom] = useState(initialRange.from);
  const [hesabatTo, setHesabatTo] = useState(initialRange.to);

  const [platform, setPlatform] = useState('all');
  const [adset, setAdset] = useState('all');

  useEffect(() => {
    if (dateOption !== 'custom') {
      const r = dateRangeFromOption(dateOption);
      setHesabatFrom(r.from);
      setHesabatTo(r.to);
    }
  }, [dateOption]);

  useEffect(() => { setAdset('all'); }, [dept]);

  const cfg = DEPTS[dept];

  // Hesabat subtitle
  const dateLabel = formatDateRangeLabel(dateOption, hesabatFrom, hesabatTo);
  const platSuffix = (platform !== 'all') ? ` · ${platform === 'facebook' ? 'Facebook' : 'Instagram'}` : '';
  const adsetSuffix = (adset !== 'all') ? ` · Ad Set: ${adset}` : '';
  const hesabatSubtitle = `${dateLabel} · ${cfg.name}${platSuffix}${adsetSuffix}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        dept={dept}
        onDeptChange={(d) => setDept(d as Dept)}
        dateOption={dateOption}
        dateFrom={hesabatFrom}
        dateTo={hesabatTo}
        onDateOptionChange={setDateOption}
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
        {tab === 'hesabat' && <div className="text-xs text-slate-500 mt-0.5">{hesabatSubtitle}</div>}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 pb-12 w-full flex-1">
        {tab === 'hesabat' && (
          <HesabatView dept={dept} from={hesabatFrom} to={hesabatTo}
                       platform={platform} adset={adset}
                       onPlatformChange={setPlatform} onAdsetChange={setAdset} />
        )}

        {tab === 'satis' && cfg.satisLayout === 'odoo' && (
          <SatisOdooView dept={dept} />
        )}
        {tab === 'satis' && cfg.satisLayout === 'lazer' && (
          <SatisLazerView />
        )}
        {tab === 'satis' && cfg.satisLayout === 'akademiya' && (
          <SatisAkademiyaView />
        )}
        {tab === 'satis' && cfg.satisLayout === 'hamisi-ekspert' && (
          <SatisHamisiEkspertView />
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
