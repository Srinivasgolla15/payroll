import React from 'react';

interface YearMonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  minYear: number;
  maxYear: number;
  minMonth: number;
  maxMonth: number;
}

export const YearMonthPicker: React.FC<YearMonthPickerProps> = ({ year, month, onChange, minYear, maxYear, minMonth, maxMonth }) => {
  const years = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex gap-2 items-center">
      <select
        value={year}
        onChange={e => onChange(Number(e.target.value), month)}
        className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={e => onChange(year, Number(e.target.value))}
        className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      >
        {months.map(m => (
          <option
            key={m}
            value={m}
            disabled={
              (year === minYear && m < minMonth) ||
              (year === maxYear && m > maxMonth)
            }
          >
            {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
          </option>
        ))}
      </select>
    </div>
  );
};
