import React from 'react';
import { SunIcon } from './icons/SunIcon';

export const ThemeToggle: React.FC = () => {
  return (
    <div className="p-2">
      <SunIcon className="w-5 h-5 text-yellow-500" />
    </div>
  );
};
