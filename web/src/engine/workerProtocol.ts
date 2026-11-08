import type { AoaParams } from './operators';
import type { OpCounts } from './aoaCore';
import type { ObjectiveWeights } from './scheduling';

/** Pesan dari UI ke worker. */
export type WorkerRequest =
  | {
      type: 'run';
      lengths: number[];
      mips: number[];
      options?: Partial<AoaParams & ObjectiveWeights>;
      seed: number;
      /** kirim laporan tiap N iterasi (default 5) */
      reportEvery?: number;
    }
  | { type: 'stop' };

export interface WorkerProgress {
  type: 'progress';
  iter: number;
  maxIter: number;
  moa: number;
  mop: number;
  bestFitness: number;
  /** estimasi analitik solusi terbaik */
  bestMakespan: number;
  bestLbi: number;
  /** beban waktu tiap VM (detik) pada solusi terbaik */
  loads: number[];
  opCounts: OpCounts;
  elapsedMs: number;
}

export interface WorkerDone {
  type: 'done';
  assignment: number[];
  convergence: number[];
  lowerBound: number;
  elapsedMs: number;
}

export type WorkerResponse = WorkerProgress | WorkerDone | { type: 'stopped'; iter: number };
