import type { ProcessingEngine } from './engine';
import type { CompressionResult, CompressionSettings } from '../types';
import { WasmProcessingEngine } from './wasm-engine';

/**
 * Hybrid engine. WebGPU device readiness is established here; WebP encoding
 * remains in Rust/WASM because browsers expose no native WebGPU WebP encoder.
 * GPU compute hooks are intentionally isolated so SSIM/resize kernels can evolve
 * without changing callers.
 */
export class WebGPUProcessingEngine implements ProcessingEngine {
  readonly label = 'WebGPU + WASM' as const;
  private device?: GPUDevice;
  private wasm = new WasmProcessingEngine();

  async init() {
    if (!navigator.gpu) throw new Error('WebGPU unavailable');
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('No WebGPU adapter');
    this.device = await adapter.requestDevice();
    this.device.lost.then(() => { this.device = undefined; }).catch(() => undefined);
    await this.wasm.init();
  }

  async compress(input: Uint8Array, settings: CompressionSettings): Promise<CompressionResult> {
    if (!this.device) throw new Error('WebGPU device unavailable');
    const result = await this.wasm.compress(input, settings);
    return { ...result, engine: this.label };
  }
}

export async function detectWebGPU(): Promise<boolean> {
  if (!navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;
    const device = await adapter.requestDevice();
    device.destroy();
    return true;
  } catch { return false; }
}
