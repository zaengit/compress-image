export type CompressionMode = 'lossless' | 'smart' | 'custom';
export type ItemStatus = 'queued' | 'compressing' | 'done' | 'error';
export type EngineLabel = 'WebGPU + WASM' | 'WASM CPU';

export interface ResizeOptions {
  kind: 'original' | 'width' | 'height' | 'max-width' | 'max-height';
  value?: number;
  maintainAspectRatio: boolean;
  preventEnlargement: boolean;
}

export interface CompressionSettings {
  mode: CompressionMode;
  quality: number;
  smartThreshold: number;
  resize: ResizeOptions;
}

export interface ImageMeta { width: number; height: number; format: string; }

export interface CompressionResult {
  bytes: Uint8Array;
  width: number;
  height: number;
  quality: number | null;
  similarity: number | null;
  engine: EngineLabel;
  durationMs: number;
}

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  meta: ImageMeta | null;
  status: ItemStatus;
  progress: number;
  result?: CompressionResult;
  error?: string;
}
