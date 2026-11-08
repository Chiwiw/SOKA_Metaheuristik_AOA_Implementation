import { describe, expect, it } from 'vitest';
import {
  AoaOptimizer, DEFAULT_PARAMS, applyOperator, createSchedulingOptimizer, decode, evaluateAssign, lowerBound,
  moa, mop, mulberry32, pickOperator, runAOA, runRandom, scaleOf,
} from './index';

const MIPS = [1000, 1500, 2000, 2500];

function tinyLengths(n: number, seed: number): number[] {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => 2000 + Math.floor(r() * 100000));
}

describe('operator & pengendali', () => {
  it('MOA naik ke moaMax dan MOP turun ke 0 di iterasi terakhir', () => {
    expect(moa(500, 500)).toBeCloseTo(1, 12);
    expect(mop(500, 500)).toBeCloseTo(0, 12);
    expect(moa(1, 500)).toBeGreaterThan(0.2);
    expect(mop(1, 500)).toBeLessThan(1);
    expect(mop(1, 500)).toBeGreaterThan(0.5);
  });

  it('applyOperator sesuai rumus paper', () => {
    const s = scaleOf(0, 4, 0.5); // = 2
    expect(s).toBe(2);
    expect(applyOperator('add', 1.5, 0.3, s)).toBeCloseTo(1.5 + 0.6, 12);
    expect(applyOperator('sub', 1.5, 0.3, s)).toBeCloseTo(1.5 - 0.6, 12);
    expect(applyOperator('mul', 1.5, 0.3, s)).toBeCloseTo(1.5 * 0.3 * 2, 12);
    expect(applyOperator('div', 1.5, 0.3, s)).toBeCloseTo((1.5 / 0.3) * 2, 9);
  });

  it('pickOperator: eksplorasi bila r1 > MOA, eksploitasi bila tidak', () => {
    expect(pickOperator(0.9, 0.9, 0.1, 0.5)).toBe('div');
    expect(pickOperator(0.9, 0.1, 0.9, 0.5)).toBe('mul');
    expect(pickOperator(0.1, 0.1, 0.9, 0.5)).toBe('sub');
    expect(pickOperator(0.1, 0.9, 0.1, 0.5)).toBe('add');
  });
});

describe('penjadwalan', () => {
  it('lowerBound = total MI / total MIPS', () => {
    expect(lowerBound([7000, 7000], MIPS)).toBeCloseTo(14000 / 7000, 12);
  });

  it('decode membatasi indeks ke 0..m-1', () => {
    expect(Array.from(decode([-3, 0.2, 1.99, 3.5, 99], 4))).toEqual([0, 0, 1, 3, 3]);
  });

  it('beban yang proporsional MIPS memberi LBI ≈ 0 dan makespan = batas bawah', () => {
    // 7 tugas identik 1000 MI; VM berkecepatan 1000/1500/2000/2500 -> beban ideal 1000:1500:2000:2500 MI
    const lengths = [1000, 1500, 2000, 2500];
    const ev = evaluateAssign([0, 1, 2, 3], lengths, MIPS);
    expect(ev.makespan).toBeCloseTo(1, 12);
    expect(ev.lbi).toBeCloseTo(0, 12);
    expect(ev.makespan / lowerBound(lengths, MIPS)).toBeCloseTo(1, 12);
  });
});

describe('AOA', () => {
  it('deterministik: seed sama → hasil sama persis', () => {
    const len = tinyLengths(40, 5);
    const a = runAOA(len, MIPS, { maxIter: 60 }, 123);
    const b = runAOA(len, MIPS, { maxIter: 60 }, 123);
    expect(Array.from(a.assignment)).toEqual(Array.from(b.assignment));
    expect(a.convergence).toEqual(b.convergence);
  });

  it('semua posisi tetap di dalam [lb, ub] dan fitness terbaik tidak pernah naik', () => {
    const len = tinyLengths(30, 9);
    const so = createSchedulingOptimizer(len, MIPS, { maxIter: 80, seed: 7 });
    const opt = so.optimizer;
    let prev = opt.init().bestFitness;
    while (opt.iter < opt.params.maxIter) {
      const s = opt.step();
      expect(s.bestFitness).toBeLessThanOrEqual(prev + 1e-15);
      prev = s.bestFitness;
      for (const x of opt.positions) for (const v of x) { expect(v).toBeGreaterThanOrEqual(opt.lb); expect(v).toBeLessThanOrEqual(opt.ub); }
    }
  });

  it('jumlah operator per iterasi = populasi × dimensi', () => {
    const opt = new AoaOptimizer({ dim: 6, lb: 0, ub: 10, fitness: (x) => x.reduce((s, v) => s + v * v, 0), seed: 3, params: { popSize: 12, maxIter: 20 }, recordOps: true });
    opt.init();
    const s = opt.step();
    expect(s.opCounts.div + s.opCounts.mul + s.opCounts.sub + s.opCounts.add).toBe(12 * 6);
    expect(opt.operatorAt(0, 0)).not.toBeNull();
  });

  it('pada instans 14 tugas, AOA ≤ Random di ≥ 95% seed (kriteria Tantang AOA)', () => {
    const len = tinyLengths(14, 77);
    let menang = 0; const total = 20;
    for (let s = 1; s <= total; s++) {
      const a = runAOA(len, MIPS, { maxIter: 200 }, s).makespan;
      const r = runRandom(len, MIPS, s).makespan;
      if (a <= r + 1e-9) menang++;
    }
    expect(menang / total).toBeGreaterThanOrEqual(0.95);
  });

  it('parameter default sesuai konfigurasi Java', () => {
    expect(DEFAULT_PARAMS).toEqual({ popSize: 50, maxIter: 500, alpha: 5, mu: 0.5, moaMin: 0.2, moaMax: 1 });
  });
});
