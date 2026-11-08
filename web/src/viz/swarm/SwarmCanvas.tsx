/**
 * SwarmCanvas — renderer Canvas 2D untuk Arena Kawanan.
 * IntersectionObserver menghentikan rAF saat di luar layar.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import type { Landscape } from './landscapes';
import { computeLandscapeRange, renderHeatmap } from './landscapes';

/** Peta operator → CSS custom property */
const OP_COLOR_VAR: Record<number, string> = {
  1: '--op-mul', // OP_CODE.mul = 1
  0: '--op-div', // OP_CODE.div = 0
  3: '--op-add', // OP_CODE.add = 3
  2: '--op-sub', // OP_CODE.sub = 2
};

function getCssVar(varName: string, el: HTMLElement): string {
  return getComputedStyle(el).getPropertyValue(varName).trim() || '#888';
}

export interface SwarmCanvasProps {
  positions: Float64Array[];
  previous: Float64Array[];
  best: Float64Array;
  lastOps: Uint8Array | null;
  dim: number; // harus 2
  lb: number;
  ub: number;
  history: Array<{ positions: Float64Array[]; previous: Float64Array[]; ops: Uint8Array | null }>;
  iter: number;
  moa: number;
  mop: number;
  bestFitness: number;
  landscape: Landscape;
}

const TRAIL_LENGTH = 10;
const TARGET_FPS = 50;
const FRAME_MS = 1000 / TARGET_FPS;

export function SwarmCanvas({
  positions, previous, best, lastOps, lb, ub,
  history, iter, moa, mop, bestFitness, landscape,
}: SwarmCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<ImageData | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const visibleRef = useRef<boolean>(true);

  // Render heatmap sekali saat landscape berubah
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;
    const range = computeLandscapeRange(landscape, lb, ub, 48);
    heatmapRef.current = renderHeatmap(landscape, lb, ub, W, H, range);
  }, [landscape, lb, ub]);

  // Mapping koordinat ruang → canvas piksel
  const toCanvas = useCallback(
    (v: number, canvasSize: number) => ((v - lb) / (ub - lb)) * canvasSize,
    [lb, ub],
  );
  const toCanvasY = useCallback(
    (v: number, H: number) => H - ((v - lb) / (ub - lb)) * H,
    [lb, ub],
  );

  // Fungsi render utama
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Heatmap
    if (heatmapRef.current) {
      ctx.putImageData(heatmapRef.current, 0, 0);
    }

    // Ambil warna CSS operator dari canvas element
    const opColors: Record<number, string> = {};
    for (const [code, varName] of Object.entries(OP_COLOR_VAR)) {
      opColors[Number(code)] = getCssVar(varName, canvas);
    }
    const inkColor = getCssVar('--ink', canvas);

    // Jejak memudar (10 iterasi terakhir)
    const trailFrames = history.slice(-TRAIL_LENGTH);
    trailFrames.forEach((frame, fi) => {
      const alpha = 0.08 + (fi / TRAIL_LENGTH) * 0.07;
      frame.positions.forEach((pos) => {
        const px = toCanvas(pos[0], W);
        const py = toCanvasY(pos[1], H);
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,80,80,${alpha})`;
        ctx.fill();
      });
    });

    // Jalur-L dan agen
    for (let i = 0; i < positions.length; i++) {
      const cur = positions[i];
      const prv = previous[i];
      if (!cur || !prv) continue;

      const x0 = toCanvas(prv[0], W);
      const y0 = toCanvasY(prv[1], H);
      const x1 = toCanvas(cur[0], W);
      const y1 = toCanvasY(cur[1], H);

      // Segmen horizontal (dimensi X → op[i*2+0])
      let opCodeX = -1;
      let opCodeY = -1;
      if (lastOps) {
        opCodeX = lastOps[i * 2];
        opCodeY = lastOps[i * 2 + 1];
      }

      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Segmen horizontal: x0,y0 → x1,y0 (operator X)
      if (opCodeX >= 0 && opColors[opCodeX]) {
        ctx.strokeStyle = opColors[opCodeX];
      } else {
        ctx.strokeStyle = `${inkColor}60`;
      }
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y0);
      ctx.stroke();

      // Segmen vertikal: x1,y0 → x1,y1 (operator Y)
      if (opCodeY >= 0 && opColors[opCodeY]) {
        ctx.strokeStyle = opColors[opCodeY];
      } else {
        ctx.strokeStyle = `${inkColor}60`;
      }
      ctx.beginPath();
      ctx.moveTo(x1, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Agen (titik)
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fillStyle = inkColor;
      ctx.fill();
    }

    // Bintang best ✦
    if (best.length >= 2) {
      const bx = toCanvas(best[0], W);
      const by = toCanvasY(best[1], H);
      ctx.font = '18px serif';
      ctx.fillStyle = inkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', bx, by);
    }

    // Anotasi HUD ringan
    ctx.font = `10px monospace`;
    ctx.fillStyle = `${inkColor}99`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`iter ${iter} · MOA ${moa.toFixed(2)} · MOP ${mop.toFixed(2)}`, 8, 8);
  }, [positions, previous, best, lastOps, history, iter, moa, mop, toCanvas, toCanvasY]);

  // rAF loop
  useEffect(() => {
    const loop = (ts: number) => {
      if (!visibleRef.current) return;
      if (ts - lastFrameRef.current >= FRAME_MS) {
        lastFrameRef.current = ts;
        draw();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // IntersectionObserver: hentikan rAF saat di luar layar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.1 },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Saat ukuran berubah, perbarui heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const range = computeLandscapeRange(landscape, lb, ub, 48);
      heatmapRef.current = renderHeatmap(landscape, lb, ub, canvas.width, canvas.height, range);
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [landscape, lb, ub, draw]);

  const agentPhase = iter > 0 ? (moa < 0.5 ? 'eksplorasi' : 'eksploitasi') : 'inisialisasi';
  const ariaLabel = `Arena Kawanan: iterasi ${iter}, fase ${agentPhase}, ` +
    `${positions.length} agen, fitness terbaik ${bestFitness.toFixed(4)}`;

  return (
    <canvas
      ref={canvasRef}
      className="arena__canvas"
      aria-label={ariaLabel}
      role="img"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
