import React from 'react';
import { formatMonthYear, formatMonthYearForInput } from '../src/utils/dateUtils';

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
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    onChange(newYear, month);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = monthNames.indexOf(e.target.value);
    if (monthIndex !== -1) {
      onChange(year, monthIndex + 1);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <select
        value={year}
        onChange={handleYearChange}
        className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={monthNames[month - 1]}
        onChange={handleMonthChange}
        className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors min-w-[120px]"
      >
        {monthNames.map((monthName, index) => {
          const monthNumber = index + 1;
          const isDisabled = (year === minYear && monthNumber < minMonth) ||
                           (year === maxYear && monthNumber > maxMonth);
          return (
            <option
              key={monthName}
              value={monthName}
              disabled={isDisabled}
            >
              {monthName}
            </option>
          );
        })}
      </select>
    </div>
  );
};
