import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
const KEY = 'aoa-theme';

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch { return 'system'; }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
    try { if (theme === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, theme); } catch { /* penyimpanan tidak tersedia */ }
  }, [theme]);

  const next: Theme = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
  const label = theme === 'system' ? 'Tema: ikut sistem' : theme === 'dark' ? 'Tema: Malam Lab' : 'Tema: Kertas Milimeter';
  return (
    <button type="button" className="keycap theme-toggle" onClick={() => setTheme(next)} aria-label={`${label}. Klik untuk mengganti.`} title={label}>
      {theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◐'}
    </button>
  );
}
