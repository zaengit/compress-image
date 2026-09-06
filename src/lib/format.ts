export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
export function percentSaved(before: number, after: number) { return before ? Math.max(0, (1 - after / before) * 100) : 0; }
export function outputName(name: string) { return `${name.replace(/\.[^.]+$/, '') || 'image'}.webp`; }
