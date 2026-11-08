import { useEffect, useState } from 'react';

export type Algo = 'AOA' | 'Random';
export const METRIC_KEYS = [
  'makespan_s', 'utilisasi_vm_pct', 'throughput_task_per_s', 'respons_rata2_s', 'lbi', 'rur_cpu_pct', 'waktu_komputasi_ms',
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export type SummaryRow = { algoritma: Algo; jumlah_cloudlet: number; runs: number } & {
  [K in MetricKey as `${K}_mean` | `${K}_std`]: number;
};

export interface PerRunRow {
  algoritma: Algo; jumlah_cloudlet: number; run: number; seed: number;
  makespan_s: number; utilisasi_vm_pct: number; throughput_task_per_s: number; respons_rata2_s: number;
  lbi: number; rur_cpu_pct: number; makespan_estimasi_s: number; fitness: number; waktu_komputasi_ms: number; task_sukses: number;
}

export interface DatasetSummaryRow {
  jumlah_cloudlet: number; total_mi: number; mean_mi: number; std_mi: number; min_mi: number; max_mi: number;
  n_kecil: number; n_sedang: number; n_besar: number; batas_bawah_makespan_s: number;
}

export type Datasets = Record<string, { length_mi: number[]; kategori: Array<'kecil' | 'sedang' | 'besar'> }>;
export type Convergence = Record<string, { iterasi: number[]; mean: number[]; std: number[]; min: number[]; max: number[] }>;
export interface TimelineTask { id: number; vm: number; start: number; finish: number; mi: number }
export interface Timeline { aoa: TimelineTask[]; random: TimelineTask[] }

export interface Config {
  cloudsimVersion: string;
  vm: { mips: number[]; pesPerVm: number; totalVcpu: number; cloudletScheduler: string };
  datasetSizes: number[];
  runsPerSize: number;
  datasetSeed: number;
  algoSeedBase: number;
  datasetMix: Array<{ kategori: string; peluang: number; lengthMiMin: number; lengthMiMax: number }>;
  aoa: { popSize: number; maxIter: number; alpha: number; mu: number; moaMin: number; moaMax: number; wMakespan: number; wLbi: number };
  metrics: Array<{ key: MetricKey; nama: string; satuan: string; arah: 'naik' | 'turun'; rumus: string }>;
}

export interface AppData {
  config: Config;
  ringkasan: SummaryRow[];
  perRun: PerRunRow[];
  datasetRingkasan: DatasetSummaryRow[];
  datasets: Datasets;
  konvergensi: Convergence;
  timeline100: Timeline;
}

const base = import.meta.env.BASE_URL; // './' → URL relatif, aman di sub-path GitHub Pages

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(`${base}data/${file}`);
  if (!res.ok) throw new Error(`Gagal memuat ${file}: ${res.status}`);
  return (await res.json()) as T;
}

let cached: Promise<AppData> | null = null;

/** Muat semua JSON sekali (hasil di-cache). */
export function loadAppData(): Promise<AppData> {
  cached ??= Promise.all([
    getJson<Config>('config.json'),
    getJson<SummaryRow[]>('hasil_ringkasan.json'),
    getJson<PerRunRow[]>('hasil_per_run.json'),
    getJson<DatasetSummaryRow[]>('dataset_ringkasan.json'),
    getJson<Datasets>('datasets.json'),
    getJson<Convergence>('konvergensi_aoa.json'),
    getJson<Timeline>('timeline_100.json'),
  ]).then(([config, ringkasan, perRun, datasetRingkasan, datasets, konvergensi, timeline100]) => ({
    config, ringkasan, perRun, datasetRingkasan, datasets, konvergensi, timeline100,
  }));
  return cached;
}

export function useAppData(): { data: AppData | null; error: string | null } {
  const [state, setState] = useState<{ data: AppData | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    loadAppData().then(
      (data) => { if (alive) setState({ data, error: null }); },
      (e: unknown) => { if (alive) setState({ data: null, error: e instanceof Error ? e.message : String(e) }); },
    );
    return () => { alive = false; };
  }, []);
  return state;
}
