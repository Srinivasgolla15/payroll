import React from 'react';
import { useTheme } from '../src/contexts/ThemeContext';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
      ) : (
        <SunIcon className="w-5 h-5 text-yellow-300" />
      )}
    </button>
  );
};
