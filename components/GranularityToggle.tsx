'use client';

interface Props {
  value: 'day' | 'month';
  onChange: (v: 'day' | 'month') => void;
}
export default function GranularityToggle({ value, onChange }: Props) {
  return (
    <div className="gran-toggle">
      <button className={`gran-btn ${value === 'day' ? 'active' : ''}`} onClick={() => onChange('day')}>Günlük</button>
      <button className={`gran-btn ${value === 'month' ? 'active' : ''}`} onClick={() => onChange('month')}>Aylıq</button>
    </div>
  );
}
