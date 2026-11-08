import { useEffect, useRef, useState } from 'react';
import {
  applyOperator,
  mop,
  scaleOf,
  OPERATOR_GLYPH,
  OPERATOR_ORDER,
} from '../../engine';
import type { Operator } from '../../engine';
import { useAppStore } from '../../store';
import './Hero.css';

/** Deskripsi ekspresi per operator (teks LCD yang bergantian). */
const EXPR_LABEL: Record<Operator, string> = {
  mul: 'best × MOP × s',
  div: 'best ÷ (MOP + ε) × s',
  add: 'best + MOP × s',
  sub: 'best − MOP × s',
};

// Parameter contoh tetap — bukan karangan; dihitung dari engine
const DEMO_BEST = 5.0;
const DEMO_T    = 100;        // iterasi contoh
const DEMO_MAX  = 500;        // maxIter default
const DEMO_LB   = 0;
const DEMO_UB   = 9;
const DEMO_MU   = 0.5;

// Hitung nilai sekali di modul (tidak berubah saat render)
const DEMO_MOP   = mop(DEMO_T, DEMO_MAX);
const DEMO_SCALE = scaleOf(DEMO_LB, DEMO_UB, DEMO_MU);

/** Hitung nilai LCD dari engine — JANGAN hardcode hasilnya. */
function computeDisplay(op: Operator): { expr: string; result: number } {
  const val = applyOperator(op, DEMO_BEST, DEMO_MOP, DEMO_SCALE);
  return { expr: EXPR_LABEL[op], result: val };
}

export function HeroSection() {
  const setSelectedOperator = useAppStore((s) => s.setSelectedOperator);

  // Indeks operator yang sedang ditampilkan di LCD
  const [opIdx, setOpIdx] = useState(0);
  // Kunci animasi — berubah saat ekspresi berganti agar CSS animation diulang
  const [animKey, setAnimKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cek reduced-motion sekali
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) return; // tanpa loop saat reduced motion

    // Putar ekspresi tiap 2.5 detik
    intervalRef.current = setInterval(() => {
      setOpIdx((prev) => {
        const next = (prev + 1) % OPERATOR_ORDER.length;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [prefersReduced]);

  const currentOp = OPERATOR_ORDER[opIdx];
  const { expr, result } = computeDisplay(currentOp);

  // Klik keycap → simpan ke store lalu scroll ke bab empat-tombol
  function handleKeyClick(op: Operator) {
    setSelectedOperator(op);
    document.getElementById('empat-tombol')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section
      id="mulai"
      className="hero-section paper-grid"
      aria-labelledby="mulai-h"
    >
      {/* Area utama: kicker + judul + LCD + keycap */}
      <div className="hero-main">
        <p className="hero__kicker">Strategi Optimasi Komputasi Awan · ITS · Kelas C</p>
        <h1 id="mulai-h">Mesin Hitung&nbsp;Awan</h1>
        <p className="hero__sub">
          Arithmetic Optimization Algorithm — kalkulator raksasa yang menjadwalkan cloudlet.
        </p>

        {/* LCD bergantian ekspresi dari engine */}
        <div className="lcd hero-lcd" role="status" aria-live="polite">
          <span className="hero-lcd__label">operator aktif: {OPERATOR_GLYPH[currentOp]}</span>
          <span
            key={animKey}
            className={`hero-lcd__expr${prefersReduced ? '' : ' hero-lcd__expr--anim'}`}
            aria-label={`Ekspresi: ${expr}`}
          >
            {expr}
          </span>
          <span className="hero-lcd__result">
            = {result.toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </span>
        </div>

        {/* Empat keycap operator */}
        <div className="hero-keys">
          {OPERATOR_ORDER.map((op) => (
            <button
              key={op}
              className="keycap"
              data-op={op}
              aria-pressed={op === currentOp}
              aria-label={`Operator ${OPERATOR_GLYPH[op]} — scroll ke Empat Tombol`}
              onClick={() => handleKeyClick(op)}
            >
              {OPERATOR_GLYPH[op]}
            </button>
          ))}
          <p className="hero-keys__hint">
            Klik tombol → lihat agen bergerak di Bab 3
          </p>
        </div>
      </div>

      {/* Kredit kelompok pojok kanan bawah */}
      <aside className="hero-credit" aria-label="Informasi kelompok">
        <strong>Kelompok 1 · Kelas C</strong><br />
        Elgracito Iryanda Endia · 5027231057<br />
        Dimas Satya A · 5027241032<br />
        Moch. Rizki NMasrullah · 5027241038<br />
        Hanif Mawla Faizi · 5027241064<br />
        Muhammad Ardiansyah Tri Wibowo · 5027241091<br />
        M. Faqih Ridho · 5027241123
      </aside>
    </section>
  );
}
