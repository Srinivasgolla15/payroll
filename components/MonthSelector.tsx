import React from 'react';

interface MonthSelectorProps {
  months: string[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ months, currentMonth, onMonthChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {months.map((month) => (
        <button
          key={month}
          className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap transition-colors duration-150 ${
            month === currentMonth
              ? 'bg-blue-600 text-white border-blue-700 shadow font-semibold'
              : 'bg-white dark:bg-slate-700/80 text-blue-900 dark:text-blue-200 border-slate-300 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-blue-800'
          }`}
          onClick={() => onMonthChange(month)}
        >
          {month}
        </button>
      ))}
    </div>
  );
};
