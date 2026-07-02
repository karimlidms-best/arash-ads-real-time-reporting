'use client';
import { useRouter } from 'next/navigation';
import DateFilter from './DateFilter';
import type { DateOption } from './utils';

interface Props {
  dept: string;
  onDeptChange: (d: string) => void;
  dateOption: DateOption;
  dateFrom: string;
  dateTo: string;
  onDateOptionChange: (o: DateOption) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  showDate: boolean;
}

const DEPT_OPTIONS = [
  { value: 'hamisi-arash', label: 'Hamısı (Arash Company)' },
  { value: 'hamisi-ekspert', label: 'Hamısı (Ekspert)' },
  { value: 'arash-dental', label: 'Arash Dental' },
  { value: 'arash-service', label: 'Arash Service' },
  { value: 'arash-company', label: 'Arash Company' },
  { value: 'arash-anti-age', label: 'Arash Anti-age' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'conference', label: 'Conference' },
  { value: 'training', label: 'Training' },
  { value: 'ekspert-lazer', label: 'Ekspert Lazer Mərkəzi' },
  { value: 'ekspert-akademiya', label: 'Ekspert Akademiya' },
];

export default function Header(props: Props) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="bg-white border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Arash" className="h-12 w-12 object-contain rounded-lg bg-white border border-slate-200/70" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">META ADS</div>
            <div className="text-xs text-slate-500">Aylıq Hesabat</div>
          </div>
        </div>
        <div className="flex-1" />
        <select value={props.dept} onChange={(e) => props.onDeptChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none cursor-pointer min-w-[240px]">
          {DEPT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {props.showDate && (
          <DateFilter
            option={props.dateOption}
            from={props.dateFrom}
            to={props.dateTo}
            onOptionChange={props.onDateOptionChange}
            onFromChange={props.onDateFromChange}
            onToChange={props.onDateToChange}
            compact
          />
        )}

        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900 transition px-2">Çıxış</button>
      </div>
    </div>
  );
}
