import type { ProcessingEngine } from './engine';
import type { CompressionResult, CompressionSettings } from '../types';
import { WasmProcessingEngine } from './wasm-engine';
import { WebGPUSimilarity } from './webgpu-similarity';

const SMART_QUALITIES = [80, 82, 85, 87, 90, 92, 95] as const;

function ownedBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function rgbaFromBytes(bytes: Uint8Array, width: number, height: number): Promise<Uint8ClampedArray> {
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined') throw new Error('Worker image decode unavailable');
  const bitmap = await createImageBitmap(new Blob([ownedBuffer(bytes)], { type: 'image/webp' }));
  try {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('2D canvas unavailable');
    context.drawImage(bitmap, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  } finally { bitmap.close(); }
}

/** Hybrid engine: WebGPU accelerates Smart-mode SSIM while Rust/WASM owns decode, resize and WebP encoding. */
export class WebGPUProcessingEngine implements ProcessingEngine {
  readonly label = 'WebGPU + WASM' as const;
  private device?: GPUDevice;
  private similarity?: WebGPUSimilarity;
  private wasm = new WasmProcessingEngine();

  async init() {
    if (!navigator.gpu) throw new Error('WebGPU unavailable');
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('No WebGPU adapter');
    this.device = await adapter.requestDevice();
    this.device.lost.then(() => { this.device = undefined; this.similarity = undefined; }).catch(() => undefined);
    this.similarity = new WebGPUSimilarity(this.device);
    await this.wasm.init();
  }

  async compress(input: Uint8Array, settings: CompressionSettings): Promise<CompressionResult> {
    if (!this.device || !this.similarity) return this.wasm.compress(input, settings);
    if (settings.mode !== 'smart') {
      const result = await this.wasm.compress(input, settings);
      return { ...result, engine: this.label };
    }

    try { return await this.compressSmart(input, settings); }
    catch { return this.wasm.compress(input, settings); }
  }

  private async compressSmart(input: Uint8Array, settings: CompressionSettings): Promise<CompressionResult> {
    if (!this.similarity) throw new Error('WebGPU similarity unavailable');
    const started = performance.now();
    const prepared = await this.wasm.prepare(input, settings.resize);

    try {
      const original = new Uint8ClampedArray(prepared.rgba());
      const evaluate = async (quality: number): Promise<CompressionResult> => {
        const candidateBytes = prepared.encode_lossy(quality);
        const decoded = await rgbaFromBytes(candidateBytes, prepared.width, prepared.height);
        const score = await this.similarity!.ssim(original, decoded);
        return {
          bytes: candidateBytes,
          width: prepared.width,
          height: prepared.height,
          quality,
          similarity: score,
          mode: 'smart',
          engine: this.label,
          durationMs: 0,
        };
      };

      // Fast path: if Q80 passes, no larger candidate can improve the target of finding the lowest acceptable quality.
      const lowest = await evaluate(SMART_QUALITIES[0]);
      if ((lowest.similarity ?? 0) >= settings.smartThreshold) {
        return { ...lowest, durationMs: performance.now() - started };
      }

      // Q95 is both the passing upper bound and the graceful fallback if the threshold is unattainable.
      const highestIndex = SMART_QUALITIES.length - 1;
      const highest = await evaluate(SMART_QUALITIES[highestIndex]);
      if ((highest.similarity ?? 0) < settings.smartThreshold) {
        return { ...highest, durationMs: performance.now() - started };
      }

      // Invariant: low fails, high passes. Binary search for the first passing preset.
      let low = 0;
      let high = highestIndex;
      let best = highest;

      while (high - low > 1) {
        const mid = low + Math.floor((high - low) / 2);
        const candidate = await evaluate(SMART_QUALITIES[mid]);
        if ((candidate.similarity ?? 0) >= settings.smartThreshold) {
          high = mid;
          best = candidate;
        } else {
          low = mid;
        }
      }

      return { ...best, durationMs: performance.now() - started };
    } finally {
      prepared.free();
    }
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
