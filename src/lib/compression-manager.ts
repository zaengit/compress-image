import type { WorkerRequest, WorkerResponse } from './engine';
import type { CompressionResult, CompressionSettings } from '../types';

interface Pending { resolve: (r: CompressionResult) => void; reject: (e: Error) => void; onProgress?: (n: number) => void; }

export class CompressionManager {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Array<{ req: WorkerRequest; pending: Pending }> = [];
  private pending = new Map<string, Pending>();

  constructor(private preferWebGPU: boolean) {
    const hc = Math.max(2, navigator.hardwareConcurrency || 4);
    const count = Math.max(1, Math.min(hc - 1, 4));
    for (let i = 0; i < count; i++) {
      const worker = new Worker(new URL('../workers/compression.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => this.handle(worker, e.data);
      worker.onerror = () => this.release(worker);
      this.workers.push(worker); this.idle.push(worker);
    }
  }

  compress(file: File, settings: CompressionSettings, onProgress?: (n: number) => void): Promise<CompressionResult> {
    return file.arrayBuffer().then((input) => new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const pending = { resolve, reject, onProgress };
      this.queue.push({ req: { id, type: 'compress', input, settings, preferWebGPU: this.preferWebGPU }, pending });
      this.pump();
    }));
  }

  destroy() { this.workers.forEach((w) => w.terminate()); this.workers = []; this.idle = []; }

  private pump() {
    while (this.idle.length && this.queue.length) {
      const worker = this.idle.pop()!; const job = this.queue.shift()!;
      this.pending.set(job.req.id, job.pending);
      worker.postMessage(job.req, [job.req.input]);
    }
  }
  private handle(worker: Worker, msg: WorkerResponse) {
    const p = this.pending.get(msg.id); if (!p) return;
    if (msg.type === 'progress') { p.onProgress?.(msg.progress ?? 0); return; }
    this.pending.delete(msg.id);
    if (msg.type === 'error' || !msg.result) p.reject(new Error(msg.error || 'Compression failed'));
    else p.resolve({ ...msg.result, bytes: new Uint8Array(msg.result.bytes) });
    this.release(worker);
  }
  private release(worker: Worker) { if (!this.idle.includes(worker)) this.idle.push(worker); this.pump(); }
}
