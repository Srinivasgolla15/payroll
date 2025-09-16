import React from 'react';
import { MONTHS } from '../constants';
import { PlusIcon } from './icons/PlusIcon';
import { ExportIcon } from './icons/ExportIcon';
import { EmployeeStatus } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onAddEmployee: () => void;
  onAddMestri: () => void;
  statusFilter: EmployeeStatus | 'All';
  onStatusFilterChange: (status: EmployeeStatus | 'All') => void;
  activeView: string;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  searchTerm?: string;
  onSearchChange?: (q: string) => void;
  onExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMonth, onMonthChange, onAddEmployee, onAddMestri, statusFilter, onStatusFilterChange, activeView, theme, onThemeToggle, searchTerm = '', onSearchChange, onExport }) => {
  const titles: Record<string, { title: string, subtitle: string }> = {
    'Payroll': { title: 'Payroll Management', subtitle: `Manage and track employee payroll for ${currentMonth}.` },
    'Employees': { title: 'Employee Management', subtitle: 'View and manage employee details.' },
    'Mestris': { title: 'Mestris Management', subtitle: 'View and manage mestri details.'},
    'Dashboard': { title: 'Dashboard', subtitle: 'Overview of payroll analytics.' },
    'Exports': { title: 'Exports', subtitle: 'Generate and download reports.' },
    'Settings': { title: 'Settings', subtitle: 'Configure application settings.' },
  };

  const currentViewInfo = titles[activeView] || { title: 'Dashboard', subtitle: '' };

  const getActionBuutton = () => {
    let text: string | null = null;
    let action: (() => void) | null = null;
    
    if (activeView === 'Employees') {
        text = 'Add Employee';
        action = onAddEmployee;
    } else if (activeView === 'Mestris') {
        text = 'Add Mestri';
        action = onAddMestri;
    }

    if (!text || !action) {
        return null;
    }

    return (
        <button 
          onClick={action}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>{text}</span>
        </button>
    );
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{currentViewInfo.title}</h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{currentViewInfo.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Employee status filter"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as EmployeeStatus | 'All')}
          className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        >
          <option value="All">All Employees</option>
          <option value={EmployeeStatus.Active}>Active</option>
          <option value={EmployeeStatus.Left}>Left</option>
        </select>
        {activeView === 'Payroll' && (
          <select
            aria-label="Month selector"
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          >
            {MONTHS.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        )}
        {activeView === 'Payroll' && (
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search name / EMP ID / Mestri"
            className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        )}
        {activeView === 'Payroll' && (
          <button 
            onClick={() => onExport && onExport()}
            className="p-2 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Export data"
          >
            <ExportIcon className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onThemeToggle}
          className="p-2 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
        {getActionBuutton()}
      </div>
    </header>
  );
};