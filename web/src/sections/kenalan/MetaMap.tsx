import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import './MetaMap.css';

/** Kartu algoritma di peta 2 sumbu (persen). Posisi = pendekatan, bukan peringkat. */
interface AlgoCard {
  id: string;
  nama: string;
  singkat: string;
  /** sumbu Y: 0 = inspirasi matematika/fisika, 100 = alam hayati */
  y: number;
  /** sumbu X: 0 = satu solusi, 100 = populasi */
  x: number;
}

const ALGOS: readonly AlgoCard[] = [
  { id: 'sa', nama: 'SA', singkat: 'Simulated Annealing', y: 12, x: 8 },
  { id: 'aoa', nama: 'AOA', singkat: 'Arithmetic Optimization Algorithm', y: 10, x: 88 },
  { id: 'pso', nama: 'PSO', singkat: 'Particle Swarm Optimization', y: 96, x: 72 },
  { id: 'ga', nama: 'GA', singkat: 'Genetic Algorithm', y: 92, x: 90 },
];

interface DragState { dx: number; dy: number }

const clampPct = (v: number): number => Math.min(88, Math.max(8, v));

/** Bab 2 — Peta Metaheuristik: kartu SA/GA/PSO/AOA digeser di kanvas 2 sumbu; AOA menyala. */
export function MetaMap() {
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>(
    () => Object.fromEntries(ALGOS.map((a) => [a.id, { x: a.x, y: a.y }])),
  );
  const [fokus, setFokus] = useState('aoa');
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const toPct = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const r = areaRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, a: AlgoCard): void => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toPct(e.clientX, e.clientY);
    if (p) dragRef.current = { dx: pos[a.id].x - p.x, dy: pos[a.id].y - p.y };
    setFokus(a.id);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const d = dragRef.current;
    if (!d) return;
    const p = toPct(e.clientX, e.clientY);
    if (!p) return;
    const id = fokus;
    setPos((prev) => ({ ...prev, [id]: { x: clampPct(p.x + d.dx), y: clampPct(p.y + d.dy) } }));
  };

  const endDrag = (): void => { dragRef.current = null; };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    const step = e.shiftKey ? 8 : 2;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const id = fokus;
    setPos((prev) => ({ ...prev, [id]: { x: clampPct(prev[id].x + d[0]), y: clampPct(prev[id].y + d[1]) } }));
  };

  return (
    <div
      className="metamap"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="group"
      aria-label="Peta metaheuristik dua sumbu: satu solusi ke populasi, inspirasi matematika ke alam. Seret kartu atau gunakan panah untuk menggeser. Posisi pendekatan, bukan peringkat."
    >
      <div className="metamap__area" ref={areaRef}>
        <span className="metamap__axis metamap__axis--x" aria-hidden="true">satu solusi → populasi</span>
        <span className="metamap__axis metamap__axis--y" aria-hidden="true">matematika → alam</span>
        {ALGOS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`metamap__card${a.id === 'aoa' ? ' metamap__card--aoa' : ''}${fokus === a.id ? ' is-fokus' : ''}`}
            style={{ left: `${pos[a.id].x}%`, top: `${pos[a.id].y}%` }}
            onPointerDown={(e) => onPointerDown(e, a)}
            onFocus={() => setFokus(a.id)}
            aria-label={`${a.nama}, ${a.singkat}. ${fokus === a.id ? 'Kartu fokus: geser dengan panah.' : ''}`}
          >
            <strong>{a.nama}</strong>
            <span>{a.singkat}</span>
          </button>
        ))}
      </div>
      <p className="metamap__caption">Posisi pendekatan, bukan peringkat.</p>
    </div>
  );
}
