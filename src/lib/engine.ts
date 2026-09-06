import type { CompressionResult, CompressionSettings, EngineLabel } from '../types';

export interface ProcessingEngine {
  readonly label: EngineLabel;
  init(): Promise<void>;
  compress(input: Uint8Array, settings: CompressionSettings): Promise<CompressionResult>;
}

export interface WorkerRequest {
  id: string;
  type: 'compress';
  input: ArrayBuffer;
  settings: CompressionSettings;
  preferWebGPU: boolean;
}
export interface WorkerResponse {
  id: string;
  type: 'result' | 'error' | 'progress';
  result?: Omit<CompressionResult, 'bytes'> & { bytes: ArrayBuffer };
  error?: string;
  progress?: number;
}
