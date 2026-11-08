import { AoaOptimizer } from './aoaCore';
import type { OptimizerOptions } from './aoaCore';
import type { AoaParams } from './operators';
import { mulberry32 } from './rng';

/** Bobot fungsi objektif: F = wMakespan·(makespan/LB) + wLbi·(LBI/0,25) — pilihan kelompok, bukan "optimal". */
export interface ObjectiveWeights { wMakespan: number; wLbi: number }
export const DEFAULT_WEIGHTS: Readonly<ObjectiveWeights> = Object.freeze({ wMakespan: 0.7, wLbi: 0.3 });

export interface Evaluation {
  fitness: number;
  /** estimasi analitik: max_v Σ length/MIPS (semua tugas dikirim bersamaan, FIFO per VM) */
  makespan: number;
  lbi: number;
  /** beban waktu tiap VM (detik) */
  loads: Float64Array;
  /** u_v = load_v / makespan */
  util: Float64Array;
}

/** Batas bawah makespan: total MI / total MIPS (semua VM 1 vCPU). */
export function lowerBound(lengths: ArrayLike<number>, mips: ArrayLike<number>): number {
  let s = 0, t = 0;
  for (let i = 0; i < lengths.length; i++) s += lengths[i];
  for (let i = 0; i < mips.length; i++) t += mips[i];
  return s / t;
}

/** Posisi kontinu → indeks VM = floor(x), dibatasi 0..m−1. */
export function decode(x: ArrayLike<number>, m: number, out: Int32Array = new Int32Array(x.length)): Int32Array {
  for (let j = 0; j < x.length; j++) {
    const v = Math.floor(x[j]);
    out[j] = v < 0 ? 0 : v > m - 1 ? m - 1 : v;
  }
  return out;
}

/** Estimasi analitik sebuah penugasan (sama dengan evaluateAssign di Java). */
export function evaluateAssign(
  vm: ArrayLike<number>, lengths: ArrayLike<number>, mips: ArrayLike<number>,
  batasBawah: number = lowerBound(lengths, mips), w: ObjectiveWeights = DEFAULT_WEIGHTS,
  loads: Float64Array = new Float64Array(mips.length), util: Float64Array = new Float64Array(mips.length),
): Evaluation {
  const m = mips.length;
  loads.fill(0);
  for (let j = 0; j < vm.length; j++) loads[vm[j]] += lengths[j] / mips[vm[j]];
  let mk = 0;
  for (let v = 0; v < m; v++) if (loads[v] > mk) mk = loads[v];
  let meanU = 0;
  for (let v = 0; v < m; v++) { util[v] = mk > 0 ? loads[v] / mk : 0; meanU += util[v]; }
  meanU /= m;
  let lbi = 0;
  for (let v = 0; v < m; v++) lbi += (util[v] - meanU) ** 2;
  lbi /= m;
  return { fitness: w.wMakespan * (mk / batasBawah) + w.wLbi * (lbi / 0.25), makespan: mk, lbi, loads, util };
}

export interface SchedulingOptimizer {
  optimizer: AoaOptimizer;
  lowerBound: number;
  /** penugasan VM untuk solusi terbaik saat ini */
  decodeBest(): Int32Array;
  evaluateBest(): Evaluation;
}

/** Pasang AoaOptimizer pada masalah penjadwalan (dim = jumlah cloudlet, rentang [0, M)). */
export function createSchedulingOptimizer(
  lengths: ArrayLike<number>, mips: ArrayLike<number>,
  options: Partial<AoaParams & ObjectiveWeights> & { seed?: number; recordOps?: boolean } = {},
): SchedulingOptimizer {
  const m = mips.length;
  const w: ObjectiveWeights = { wMakespan: options.wMakespan ?? DEFAULT_WEIGHTS.wMakespan, wLbi: options.wLbi ?? DEFAULT_WEIGHTS.wLbi };
  const lb = lowerBound(lengths, mips);
  const tmp = new Int32Array(lengths.length);
  const loads = new Float64Array(m), util = new Float64Array(m);
  const fitness: OptimizerOptions['fitness'] = (x) => evaluateAssign(decode(x, m, tmp), lengths, mips, lb, w, loads, util).fitness;
  const params: Partial<AoaParams> = {};
  for (const k of ['popSize', 'maxIter', 'alpha', 'mu', 'moaMin', 'moaMax'] as const) if (options[k] !== undefined) params[k] = options[k];
  const optimizer = new AoaOptimizer({ dim: lengths.length, lb: 0, ub: m - 1e-9, fitness, params, seed: options.seed ?? 1, recordOps: options.recordOps });
  return {
    optimizer,
    lowerBound: lb,
    decodeBest: () => decode(optimizer.best, m),
    evaluateBest: () => evaluateAssign(decode(optimizer.best, m), lengths, mips, lb, w),
  };
}

export interface ScheduleResult extends Evaluation {
  assignment: Int32Array;
  convergence: number[];
  ms: number;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Jalankan AOA sampai selesai. */
export function runAOA(
  lengths: ArrayLike<number>, mips: ArrayLike<number>,
  options: Partial<AoaParams & ObjectiveWeights> = {}, seed = 1,
): ScheduleResult {
  const t0 = now();
  const so = createSchedulingOptimizer(lengths, mips, { ...options, seed });
  const { convergence } = so.optimizer.run();
  return { ...so.evaluateBest(), assignment: so.decodeBest(), convergence, ms: now() - t0 };
}

/** Random Scheduling: tiap cloudlet ke VM acak seragam. */
export function runRandom(
  lengths: ArrayLike<number>, mips: ArrayLike<number>, seed = 1, w: ObjectiveWeights = DEFAULT_WEIGHTS,
): Evaluation & { assignment: Int32Array } {
  const rnd = mulberry32(seed);
  const vm = new Int32Array(lengths.length);
  for (let j = 0; j < vm.length; j++) vm[j] = Math.floor(rnd() * mips.length);
  return { ...evaluateAssign(vm, lengths, mips, lowerBound(lengths, mips), w), assignment: vm };
}

