/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from '../lib/engine';
import { WebGPUProcessingEngine } from '../lib/webgpu-engine';
import { WasmProcessingEngine } from '../lib/wasm-engine';

let preferred: 'gpu' | 'cpu' | null = null;
let engine: WebGPUProcessingEngine | WasmProcessingEngine;

async function getEngine(preferGpu: boolean) {
  if (engine && preferred === (preferGpu ? 'gpu' : 'cpu')) return engine;
  if (preferGpu) {
    try { const gpu = new WebGPUProcessingEngine(); await gpu.init(); engine = gpu; preferred = 'gpu'; return gpu; } catch { /* fallback */ }
  }
  const cpu = new WasmProcessingEngine(); await cpu.init(); engine = cpu; preferred = 'cpu'; return cpu;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    self.postMessage({ id: req.id, type: 'progress', progress: 15 } satisfies WorkerResponse);
    const active = await getEngine(req.preferWebGPU);
    self.postMessage({ id: req.id, type: 'progress', progress: 35 } satisfies WorkerResponse);
    const result = await active.compress(new Uint8Array(req.input), req.settings);
    const bytes = result.bytes.buffer.slice(result.bytes.byteOffset, result.bytes.byteOffset + result.bytes.byteLength);
    self.postMessage({ id: req.id, type: 'result', result: { ...result, bytes } } satisfies WorkerResponse, [bytes]);
  } catch (error) {
    self.postMessage({ id: req.id, type: 'error', error: error instanceof Error ? error.message : String(error) } satisfies WorkerResponse);
  }
};
