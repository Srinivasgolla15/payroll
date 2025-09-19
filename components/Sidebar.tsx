import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PayrollIcon } from './icons/PayrollIcon';
import { ExportIcon } from './icons/ExportIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const menuItems = [
  { name: 'Dashboard', icon: DashboardIcon },
  { name: 'Employees', icon: UsersIcon },
  { name: 'Mestris', icon: BriefcaseIcon },
  { name: 'Payroll', icon: PayrollIcon },
  ];

export const Sidebar: React.FC<SidebarProps> = ({ activeMenu, setActiveMenu }) => {
  return (
    <aside className="w-64 bg-white/80 dark:bg-slate-800/95 backdrop-blur-lg border-r border-slate-200 dark:border-slate-700 p-6 flex-shrink-0 hidden md:flex flex-col z-20">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-800 rounded-lg shadow-md flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-wider">PayrollPro</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = activeMenu === item.name;
          return (
            <a
              key={item.name}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveMenu(item.name); }}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
};