import { useEffect, useState } from 'react';

const THEMES = [
  { id: 'dark', label: '🌙 Dark' },
  { id: 'light', label: '☀️ Light' },
  { id: 'dracula', label: '🧛 Dracula' },
  { id: 'nord', label: '❄️ Nord' },
  { id: 'synthwave', label: '🌆 Synthwave' },
  { id: 'forest', label: '🌲 Forest' }
];

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored && THEMES.some((t) => t.id === stored)) return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      title="Choose theme"
      className="text-sm bg-panel border border-border rounded-lg px-3 py-2 hover:border-accent transition cursor-pointer"
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
