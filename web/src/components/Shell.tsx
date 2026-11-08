import { useEffect, useRef, type ReactNode } from 'react';
import { CHAPTERS } from '../sections/registry';
import { ThemeToggle } from './ThemeToggle';

export function Shell({ children }: { children: ReactNode }) {
  // Ref ke elemen bilah progres scroll
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Perbarui lebar bilah sesuai posisi scroll
    function handleScroll() {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop || document.body.scrollTop;
      const total = doc.scrollHeight - doc.clientHeight;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <a className="skip-link" href="#konten">Lompat ke konten</a>
      {/* Bilah progres scroll halaman */}
      <div ref={barRef} className="scroll-progress" aria-hidden="true" />
      <nav className="rail" aria-label="Bab">
        <ol>
          {CHAPTERS.map((c) => (
            <li key={c.id}>
              <a href={`#${c.id}`} aria-label={`Bab ${c.no}: ${c.judul}`}>
                <span className="rail__dot" aria-hidden="true" />
                <span className="rail__label">{c.no}. {c.judul}</span>
              </a>
            </li>
          ))}
        </ol>
        <ThemeToggle />
      </nav>
      <main id="konten" tabIndex={-1}>{children}</main>
      {/* Footer kredit kelompok */}
      <footer className="site-footer">
        Kelompok 1 Kelas C &middot; ITS &middot; Strategi Optimasi Komputasi Awan 2026
      </footer>
    </>
  );
}
