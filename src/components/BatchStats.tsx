import type { ImageItem } from '../types'; import { formatBytes } from '../lib/format';
export function BatchStats({ items }:{items:ImageItem[]}) {
  const original=items.reduce((s,i)=>s+i.file.size,0);
  const compressed=items.reduce((s,i)=>s+(i.result?.bytes.byteLength??0),0);
  const saved=items.reduce((s,i)=>s+(i.result?Math.max(0,i.file.size-i.result.bytes.byteLength):0),0);
  const reduction=original?(saved/original)*100:0;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[['Images',String(items.length)],['Original',formatBytes(original)],['Compressed',formatBytes(compressed)],['Saved',formatBytes(saved)],['Reduction',`${reduction.toFixed(1)}%`]].map(([k,v])=><div key={k} className="rounded-2xl border border-neutral-200 bg-white p-4"><div className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">{k}</div><div className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">{v}</div></div>)}</div>;
}
