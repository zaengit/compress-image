import type { ProcessingEngine } from './engine';
import type { CompressionResult, CompressionSettings } from '../types';

let wasmPromise: Promise<typeof import('../wasm/image_compressor')> | null = null;
async function wasm() {
  wasmPromise ??= import('../wasm/image_compressor').then(async (m) => { await m.default(); return m; });
  return wasmPromise;
}

export class WasmProcessingEngine implements ProcessingEngine {
  readonly label = 'WASM CPU' as const;
  async init() { await wasm(); }
  async compress(input: Uint8Array, settings: CompressionSettings): Promise<CompressionResult> {
    const w = await wasm();
    const started = performance.now();
    const result = w.compress_to_webp(input, settings.mode, settings.mode === 'custom' ? settings.quality : undefined, settings.smartThreshold, JSON.stringify(settings.resize));
    return {
      bytes: result.bytes(), width: result.width, height: result.height,
      quality: result.quality ?? null, similarity: result.similarity ?? null,
      engine: this.label, durationMs: performance.now() - started,
    };
  }
}
