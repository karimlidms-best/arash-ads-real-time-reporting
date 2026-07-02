'use client';
import { useEffect, useState } from 'react';
import { Info, ArrowUp } from 'lucide-react';
import DateFilter from './DateFilter';
import { fmtAZN, type DateOption, dateRangeFromOption } from './utils';

export default function SatisHamisiEkspertView() {
  const [clinic, setClinic] = useState<any[]>([]);
  const [academy, setAcademy] = useState<any[]>([]);

  const [dateOption, setDateOption] = useState<DateOption>('this-month');
  const initialRange = dateRangeFromOption('this-month');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);

  useEffect(() => {
    if (dateOption !== 'custom') {
      const r = dateRangeFromOption(dateOption);
      setFrom(r.from);
      setTo(r.to);
    }
  }, [dateOption]);

  useEffect(() => {
    fetch(`/api/sheets/clinic?from=${from}&to=${to}`).then(r => r.json()).then(d => setClinic(d.records || []));
    fetch(`/api/sheets/academy?from=${from}&to=${to}`).then(r => r.json()).then(d => setAcademy(d.filtered || []));
  }, [from, to]);

  const clinicRevenue = clinic.reduce((s, r) => s + (r.amount || 0), 0);
  const academyRevenue = academy.reduce((s, r) => s + (r.payment || 0), 0);
  const total = clinicRevenue + academyRevenue;

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-2.5 text-xs">
        <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700"><Info className="w-4 h-4" /></div>
        <div className="text-indigo-900">Bu görünüş yalnız <span className="font-medium">cəm gəlir</span> göstərir. Ətraflı baxış üçün konkret şöbə seçin.</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1.5 px-1">Tarix</label>
          <DateFilter option={dateOption} from={from} to={to}
                      onOptionChange={setDateOption} onFromChange={setFrom} onToChange={setTo} />
        </div>
      </div>

      <div className="rounded-2xl p-6 border" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
        <div className="text-sm font-medium text-slate-600 mb-2">Ümumi Gəlir (Ekspert)</div>
        <div className="text-5xl font-semibold tab-num" style={{ color: '#15803d' }}>{fmtAZN(total)}</div>
        <div className="text-xs mt-3 text-slate-500">Ekspert Lazer Mərkəzi: {fmtAZN(clinicRevenue)} · Ekspert Akademiya: {fmtAZN(academyRevenue)}</div>
      </div>

      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
        <ArrowUp className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600 font-medium">Daha ətraflı baxış üçün konkret şöbə seçin</p>
        <p className="text-xs text-slate-400 mt-1">Yuxarıdakı dropdown-dan "Ekspert Lazer Mərkəzi" və ya "Ekspert Akademiya" seçə bilərsiniz</p>
      </div>
    </div>
  );
}
