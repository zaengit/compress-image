import type { ImageMeta } from '../types';

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function readBrowserMetadata(file: File): Promise<ImageMeta> {
  const bitmap = await createImageBitmap(file);
  const meta = { width: bitmap.width, height: bitmap.height, format: file.type.replace('image/', '').toUpperCase() };
  bitmap.close();
  return meta;
}

export function uniqueWebpNames(files: File[]): string[] {
  const used = new Map<string, number>();
  return files.map((file) => {
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return `${base}${n ? `-${n + 1}` : ''}.webp`;
  });
}
