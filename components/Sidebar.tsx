import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PayrollIcon } from './icons/PayrollIcon';
import { ExportIcon } from './icons/ExportIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { useAuth } from '../contexts/AuthContext';

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
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="w-64 bg-white/80 dark:bg-slate-800/95 backdrop-blur-lg border-r border-slate-200 dark:border-slate-700 p-6 flex-shrink-0 hidden md:flex flex-col z-20">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-800 rounded-lg shadow-md flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-wider">Payroll</h1>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
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

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 w-full text-left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};