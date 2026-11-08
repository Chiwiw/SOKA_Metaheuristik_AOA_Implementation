import type { WorkerRequest, WorkerResponse } from './workerProtocol';

export interface AoaWorkerHandle {
  run(req: Extract<WorkerRequest, { type: 'run' }>): void;
  stop(): void;
  terminate(): void;
}

/** Bungkus Worker bertipe: `const w = createAoaWorker(onMessage); w.run({...}); w.terminate();` */
export function createAoaWorker(onMessage: (msg: WorkerResponse) => void): AoaWorkerHandle {
  const worker = new Worker(new URL('./aoa.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => onMessage(e.data);
  return {
    run: (req) => worker.postMessage(req satisfies WorkerRequest),
    stop: () => worker.postMessage({ type: 'stop' } satisfies WorkerRequest),
    terminate: () => worker.terminate(),
  };
}
