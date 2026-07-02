'use client';
import { DATE_OPTIONS, type DateOption } from './utils';

interface Props {
  option: DateOption;
  from: string;
  to: string;
  onOptionChange: (option: DateOption) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  compact?: boolean;
}

export default function DateFilter({ option, from, to, onOptionChange, onFromChange, onToChange, compact }: Props) {
  const wrapCls = compact
    ? "flex items-center gap-2 flex-wrap"
    : "flex items-center gap-2 flex-wrap";
  const selectCls = compact
    ? "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none cursor-pointer"
    : "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none cursor-pointer";

  return (
    <div className={wrapCls}>
      <select value={option} onChange={(e) => onOptionChange(e.target.value as DateOption)}
              className={selectCls}>
        {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {option === 'custom' && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
          <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)}
                 className="bg-transparent text-sm outline-none px-1" />
          <span className="text-slate-400 text-sm">→</span>
          <input type="date" value={to} onChange={(e) => onToChange(e.target.value)}
                 className="bg-transparent text-sm outline-none px-1" />
        </div>
      )}
    </div>
  );
}
