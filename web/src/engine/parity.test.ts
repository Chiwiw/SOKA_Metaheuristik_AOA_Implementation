// Uji paritas: mesin AOA TypeScript vs hasil simulasi Java (estimasi makespan per run).
// Jalankan: npm run parity   (butuh public/data/hasil_per_run.json dan datasets.json; ±30–60 detik)
// Lolos bila selisih rata-rata makespan tiap (algoritma, ukuran) < 3 galat baku gabungan (uji Welch).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runAOA, runRandom } from './index';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../../public/data/${f}`, import.meta.url), 'utf-8'));
const perRun = read('hasil_per_run.json') as Array<{ algoritma: string; jumlah_cloudlet: number; makespan_estimasi_s: number }>;
const datasets = read('datasets.json') as Record<string, { length_mi: number[] }>;
const config = read('config.json') as { vm: { mips: number[] }; runsPerSize: number };

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

describe('paritas mesin TS vs Java', () => {
  for (const alg of ['AOA', 'Random'] as const) {
    for (const n of Object.keys(datasets)) {
      it(`${alg} N=${n}`, () => {
        const len = datasets[n].length_mi;
        const java = perRun.filter((r) => r.algoritma === alg && String(r.jumlah_cloudlet) === n).map((r) => r.makespan_estimasi_s);
        const ts: number[] = [];
        for (let run = 1; run <= config.runsPerSize; run++) {
          const seed = 99 + 1000 * Number(n) + run;
          ts.push((alg === 'AOA' ? runAOA(len, config.vm.mips, {}, seed) : runRandom(len, config.vm.mips, seed)).makespan);
        }
        const se = Math.sqrt(sd(java) ** 2 / java.length + sd(ts) ** 2 / ts.length);
        const z = (mean(ts) - mean(java)) / se;
        console.log(`${alg} N=${n}: Java ${mean(java).toFixed(1)}±${sd(java).toFixed(1)} | TS ${mean(ts).toFixed(1)}±${sd(ts).toFixed(1)} | z=${z.toFixed(2)}`);
        expect(Math.abs(z)).toBeLessThan(3);
      });
    }
  }
});
