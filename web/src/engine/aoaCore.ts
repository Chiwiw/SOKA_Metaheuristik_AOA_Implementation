import { CODE_OP, DEFAULT_PARAMS, EPS, OP_CODE, clamp, moa as moaFn, mop as mopFn, scaleOf } from './operators';
import type { AoaParams, Operator } from './operators';
import { mulberry32 } from './rng';
import type { Rng } from './rng';

export type OpCounts = Record<Operator, number>;
export const emptyCounts = (): OpCounts => ({ div: 0, mul: 0, sub: 0, add: 0 });

export interface StepInfo {
  iter: number;
  moa: number;
  mop: number;
  bestFitness: number;
  /** jumlah gen yang memakai tiap operator pada iterasi ini */
  opCounts: OpCounts;
  done: boolean;
}

export interface OptimizerOptions {
  dim: number;
  lb: number;
  ub: number;
  /** fungsi biaya yang diminimalkan */
  fitness: (x: Float64Array) => number;
  params?: Partial<AoaParams>;
  seed?: number;
  rng?: Rng;
  /** rekam operator tiap (agen, gen) di `lastOps` — untuk visualisasi; matikan untuk N besar */
  recordOps?: boolean;
}

/**
 * AOA generik di ruang kontinu [lb, ub]^dim. Dipakai oleh penjadwalan (lewat decode) dan oleh
 * demo 2D (Arena Kawanan), sehingga yang dilihat pembaca = algoritma yang benar-benar dijalankan.
 *
 * Urutan konsumsi bilangan acak identik dengan versi Java (inisialisasi per agen, lalu r1,r2,r3 per gen).
 * `best` diperbarui segera setelah tiap agen dievaluasi (agen berikutnya memakai best terbaru).
 */
export class AoaOptimizer {
  readonly dim: number;
  readonly lb: number;
  readonly ub: number;
  readonly params: AoaParams;
  readonly positions: Float64Array[];
  readonly best: Float64Array;
  /** posisi tiap agen SEBELUM langkah terakhir (untuk jejak/animasi); selalu terisi setelah step() */
  readonly previous: Float64Array[];
  /** kode operator (0..3) tiap [agen*dim + gen] pada langkah terakhir; hanya jika recordOps */
  readonly lastOps: Uint8Array | null;
  bestFitness = Infinity;
  iter = 0;

  private readonly fitness: (x: Float64Array) => number;
  private readonly rnd: Rng;
  private readonly scale: number;

  constructor(opts: OptimizerOptions) {
    this.dim = opts.dim;
    this.lb = opts.lb;
    this.ub = opts.ub;
    this.params = { ...DEFAULT_PARAMS, ...opts.params };
    this.fitness = opts.fitness;
    this.rnd = opts.rng ?? mulberry32(opts.seed ?? 1);
    this.scale = scaleOf(opts.lb, opts.ub, this.params.mu);
    this.positions = Array.from({ length: this.params.popSize }, () => new Float64Array(opts.dim));
    this.previous = Array.from({ length: this.params.popSize }, () => new Float64Array(opts.dim));
    this.best = new Float64Array(opts.dim);
    this.lastOps = opts.recordOps ? new Uint8Array(this.params.popSize * opts.dim) : null;
  }

  /** Inisialisasi acak seragam + evaluasi (iterasi 0). */
  init(): StepInfo {
    const { lb, ub, dim } = this;
    for (let i = 0; i < this.positions.length; i++) {
      const xi = this.positions[i];
      for (let j = 0; j < dim; j++) xi[j] = lb + this.rnd() * (ub - lb);
      this.previous[i].set(xi);
      const f = this.fitness(xi);
      if (f < this.bestFitness) { this.bestFitness = f; this.best.set(xi); }
    }
    this.iter = 0;
    return { iter: 0, moa: this.params.moaMin, mop: 1, bestFitness: this.bestFitness, opCounts: emptyCounts(), done: this.params.maxIter === 0 };
  }

  /** Satu iterasi AOA. */
  step(): StepInfo {
    const { maxIter, alpha, moaMin, moaMax } = this.params;
    const it = ++this.iter;
    const moaV = moaFn(it, maxIter, moaMin, moaMax);
    const mopV = mopFn(it, maxIter, alpha);
    const counts = emptyCounts();
    const { best, lb, ub, dim, scale, rnd, lastOps } = this;
    for (let i = 0; i < this.positions.length; i++) {
      const xi = this.positions[i];
      this.previous[i].set(xi);
      for (let j = 0; j < dim; j++) {
        const r1 = rnd(), r2 = rnd(), r3 = rnd();
        let x: number;
        let op: Operator;
        if (r1 > moaV) {
          if (r2 > 0.5) { x = (best[j] / (mopV + EPS)) * scale; op = 'div'; }
          else { x = best[j] * mopV * scale; op = 'mul'; }
        } else if (r3 > 0.5) { x = best[j] - mopV * scale; op = 'sub'; }
        else { x = best[j] + mopV * scale; op = 'add'; }
        counts[op]++;
        if (lastOps) lastOps[i * dim + j] = OP_CODE[op];
        xi[j] = clamp(x, lb, ub);
      }
      const f = this.fitness(xi);
      if (f < this.bestFitness) { this.bestFitness = f; best.set(xi); }
    }
    return { iter: it, moa: moaV, mop: mopV, bestFitness: this.bestFitness, opCounts: counts, done: it >= maxIter };
  }

  /** Operator yang dipakai agen i pada gen j di langkah terakhir (butuh recordOps). */
  operatorAt(i: number, j: number): Operator | null {
    return this.lastOps ? CODE_OP[this.lastOps[i * this.dim + j]] : null;
  }

  /** Jalankan sampai selesai; kurva konvergensi (indeks 0 = setelah init). */
  run(onStep?: (s: StepInfo) => void): { convergence: number[]; last: StepInfo } {
    let last = this.init();
    const convergence = [last.bestFitness];
    onStep?.(last);
    while (!last.done) {
      last = this.step();
      convergence.push(last.bestFitness);
      onStep?.(last);
    }
    return { convergence, last };
  }
}
