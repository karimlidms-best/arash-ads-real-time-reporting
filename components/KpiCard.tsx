'use client';
import { LucideIcon, Info } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sublabel?: string;
  tooltip?: string;
  muted?: boolean;
}
export default function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sublabel, tooltip, muted }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: iconBg, color: iconColor }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          {label}
          {tooltip && (
            <span className="tooltip-wrap">
              <Info className="w-3 h-3 text-amber-500" />
              <span className="tooltip-content">{tooltip}</span>
            </span>
          )}
        </div>
      </div>
      <div className={`text-2xl font-semibold tab-num ${muted ? 'text-slate-500' : ''}`}>{value}</div>
      {sublabel && <div className="text-xs text-slate-400 mt-1">{sublabel}</div>}
    </div>
  );
}
