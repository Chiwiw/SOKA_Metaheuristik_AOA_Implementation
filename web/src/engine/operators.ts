/**
 * Operator & pengendali AOA (Abualigah dkk., 2021) — sama persis dengan AOASchedulingSim.java.
 * Jangan ubah rumus di sini tanpa mengubah Java dan menjalankan `npm run parity`.
 */
export type Operator = 'div' | 'mul' | 'sub' | 'add';

/** Urutan tampilan konvensional: hangat (eksplorasi) dulu, lalu dingin (eksploitasi). */
export const OPERATOR_ORDER: readonly Operator[] = ['mul', 'div', 'add', 'sub'];
export const OPERATOR_GLYPH: Record<Operator, string> = { mul: '×', div: '÷', add: '+', sub: '−' };
export const OPERATOR_PHASE: Record<Operator, 'eksplorasi' | 'eksploitasi'> = {
  mul: 'eksplorasi', div: 'eksplorasi', add: 'eksploitasi', sub: 'eksploitasi',
};
/** Kode kompak untuk perekaman operator per gen: 0=div 1=mul 2=sub 3=add. */
export const OP_CODE: Record<Operator, number> = { div: 0, mul: 1, sub: 2, add: 3 };
export const CODE_OP: readonly Operator[] = ['div', 'mul', 'sub', 'add'];

export const EPS = 2.220446049250313e-16;

export interface AoaParams {
  popSize: number;
  maxIter: number;
  /** sensitivitas eksploitasi */
  alpha: number;
  /** parameter kontrol pencarian */
  mu: number;
  moaMin: number;
  moaMax: number;
}

export const DEFAULT_PARAMS: Readonly<AoaParams> = Object.freeze({
  popSize: 50,
  maxIter: 500,
  alpha: 5,
  mu: 0.5,
  moaMin: 0.2,
  moaMax: 1.0,
});

/** Math Optimizer Accelerated: naik linear moaMin → moaMax. Iterasi mulai dari 1. */
export function moa(it: number, maxIter: number, moaMin = DEFAULT_PARAMS.moaMin, moaMax = DEFAULT_PARAMS.moaMax): number {
  return moaMin + it * ((moaMax - moaMin) / maxIter);
}

/** Math Optimizer Probability: turun ≈1 → 0. */
export function mop(it: number, maxIter: number, alpha = DEFAULT_PARAMS.alpha): number {
  return 1 - Math.pow(it, 1 / alpha) / Math.pow(maxIter, 1 / alpha);
}

/** s = (UB − LB)·μ + LB */
export function scaleOf(lb: number, ub: number, mu: number): number {
  return (ub - lb) * mu + lb;
}

/** Satu operator untuk satu dimensi, TANPA clamp. */
export function applyOperator(op: Operator, bestJ: number, mopVal: number, scale: number): number {
  switch (op) {
    case 'div': return (bestJ / (mopVal + EPS)) * scale;
    case 'mul': return bestJ * mopVal * scale;
    case 'sub': return bestJ - mopVal * scale;
    case 'add': return bestJ + mopVal * scale;
  }
}

/** Pemilihan operator dari tiga bilangan acak (konvensi kode referensi: r2>0,5 → ÷ ; r3>0,5 → −). */
export function pickOperator(r1: number, r2: number, r3: number, moaVal: number): Operator {
  if (r1 > moaVal) return r2 > 0.5 ? 'div' : 'mul';
  return r3 > 0.5 ? 'sub' : 'add';
}

export function clamp(x: number, lb: number, ub: number): number {
  return x < lb ? lb : x > ub ? ub : x;
}
