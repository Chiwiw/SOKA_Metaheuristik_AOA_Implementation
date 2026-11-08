/// Web Worker: menjalankan AOA penjadwalan di luar thread utama, bertahap agar pesan "stop" bisa masuk.
import { createSchedulingOptimizer } from './scheduling';
import type { WorkerRequest, WorkerResponse } from './workerProtocol';

const ctx = globalThis as unknown as {
  postMessage(msg: WorkerResponse): void;
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
};

let stopRequested = false;
let running = false;

ctx.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === 'stop') { stopRequested = true; return; }
  if (msg.type === 'run' && !running) start(msg);
};

function start(req: Extract<WorkerRequest, { type: 'run' }>): void {
  running = true;
  stopRequested = false;
  const t0 = performance.now();
  const every = Math.max(1, req.reportEvery ?? 5);
  const so = createSchedulingOptimizer(req.lengths, req.mips, { ...req.options, seed: req.seed, recordOps: false });
  const opt = so.optimizer;
  const maxIter = opt.params.maxIter;
  const convergence: number[] = [];

  const report = (s: ReturnType<typeof opt.step>): void => {
    const ev = so.evaluateBest();
    ctx.postMessage({
      type: 'progress', iter: s.iter, maxIter, moa: s.moa, mop: s.mop, bestFitness: s.bestFitness,
      bestMakespan: ev.makespan, bestLbi: ev.lbi, loads: Array.from(ev.loads), opCounts: s.opCounts,
      elapsedMs: performance.now() - t0,
    });
  };

  let s = opt.init();
  convergence.push(s.bestFitness);
  report(s);

  // Kerjakan beberapa iterasi per "tick" (~12 ms) lalu serahkan kendali supaya pesan stop terbaca.
  const tick = (): void => {
    if (stopRequested) { running = false; ctx.postMessage({ type: 'stopped', iter: s.iter }); return; }
    const tickStart = performance.now();
    while (!s.done && performance.now() - tickStart < 12) {
      s = opt.step();
      convergence.push(s.bestFitness);
      if (s.iter % every === 0 || s.done) report(s);
    }
    if (s.done) {
      running = false;
      ctx.postMessage({
        type: 'done', assignment: Array.from(so.decodeBest()), convergence, lowerBound: so.lowerBound,
        elapsedMs: performance.now() - t0,
      });
      return;
    }
    setTimeout(tick, 0);
  };
  setTimeout(tick, 0);
}
