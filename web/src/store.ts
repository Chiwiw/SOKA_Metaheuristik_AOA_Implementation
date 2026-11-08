/**
 * store.ts — state Zustand bersama lintas bab.
 * Dijaga kecil: hanya state yang perlu dibagi antar komponen berbeda.
 */
import { create } from 'zustand';
import type { Operator } from './engine';

/** Satu bingkai riwayat kawanan untuk slider waktu bab 4. */
export interface SwarmFrame {
  iter: number;
  moa: number;
  mop: number;
  bestFitness: number;
  /** posisi tiap agen: positions[i][j] = pos agen i dimensi j */
  positions: Float64Array[];
  /** previous: posisi sebelum langkah ini */
  previous: Float64Array[];
  /** kode operator per (agen*dim + gen); null jika recordOps=false */
  ops: Uint8Array | null;
  /** cacah per operator */
  opCounts: Record<Operator, number>;
}

interface AppStore {
  /** Operator yang dipilih lewat keycap hero (bab 0 → scroll ke bab 3) */
  selectedOperator: Operator | null;
  setSelectedOperator: (op: Operator | null) => void;

  /** Riwayat iterasi Arena Kawanan (diisi bab 2–4, dibaca bab 4) */
  swarmHistory: SwarmFrame[];
  setSwarmHistory: (h: SwarmFrame[]) => void;

  /** Iterasi yang ditampilkan slider waktu bab 4 */
  swarmPlayhead: number;
  setSwarmPlayhead: (t: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedOperator: null,
  setSelectedOperator: (op) => set({ selectedOperator: op }),

  swarmHistory: [],
  setSwarmHistory: (h) => set({ swarmHistory: h }),

  swarmPlayhead: 0,
  setSwarmPlayhead: (t) => set({ swarmPlayhead: t }),
}));

