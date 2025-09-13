import React from 'react';
import { useTheme } from '../theme-context';

const options = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative inline-block text-left">
      <button
        className="px-3 py-2 rounded bg-gray-700 text-white dark:bg-gray-900 dark:text-white border border-gray-600"
        id="theme-menu"
        aria-haspopup="true"
        aria-expanded="false"
      >
        Theme: {options.find(o => o.value === theme)?.label || 'Dark'} ▼
      </button>
      <div className="absolute z-10 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block" style={{ minWidth: '8rem' }}>
        <ul className="py-1">
          {options.map(opt => (
            <li key={opt.value}>
              <button
                className={`w-full text-left px-4 py-2 text-sm ${theme === opt.value ? 'font-bold bg-gray-200 dark:bg-gray-700' : ''}`}
                onClick={() => setTheme(opt.value as any)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        .relative:hover .absolute,
        .relative:focus-within .absolute {
          display: block;
        }
        .absolute {
          display: none;
        }
      `}</style>
    </div>
  );
}