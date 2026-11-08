import type { ReactNode } from 'react';
import { OPERATOR_GLYPH } from '../engine';
import type { Chapter } from '../sections/registry';

/** Bagian laci "Lihat lebih dalam". */
export interface LaciBagian {
  judul: string;
  isi: ReactNode;
}

interface ChapterShellProps {
  chapter: Chapter;
  /** Kalimat pembuka bab (≤ 45 kata tubuh per layar). */
  lead: ReactNode;
  /** Deskripsi momen khas untuk placeholder visual (diganti komponen nyata di fase berikutnya). */
  momen: string;
  /** Anak tambahan (komponen bab nyata) — bila ada, placeholder visual tidak ditampilkan. */
  children?: ReactNode;
  laci: LaciBagian[];
}

/**
 * Kerangka bab final: glyph operator besar, nomor + judul + tagline, lead, slot visual utama,
 * laci "Lihat lebih dalam" untuk detail panjang (docs/04).
 */
export function ChapterShell({ chapter, lead, momen, laci, children }: ChapterShellProps) {
  return (
    <section id={chapter.id} className="chapter" aria-labelledby={`${chapter.id}-h`}>
      <div className="chapter__glyph" aria-hidden="true">{chapter.glyph ? OPERATOR_GLYPH[chapter.glyph] : '∑'}</div>
      <p className="chapter__no">Bab {chapter.no} · fase {chapter.fase}</p>
      <h2 id={`${chapter.id}-h`}>{chapter.judul}</h2>
      <p className="chapter__tagline">{chapter.tagline}</p>
      <p className="chapter__lead">{lead}</p>

      {children ?? (
        <div className="viz-ph lcd" role="note" aria-label={`Visual utama ${chapter.judul} — dibangun pada fase ${chapter.fase}`}>
          <span className="viz-ph__fase">visual utama · fase {chapter.fase}</span>
          <span className="viz-ph__momen">{momen}</span>
        </div>
      )}

      {laci.map((b) => (
        <details className="laci" key={b.judul}>
          <summary>Lihat lebih dalam — {b.judul}</summary>
          <div className="laci-content">{b.isi}</div>
        </details>
      ))}
    </section>
  );
}
