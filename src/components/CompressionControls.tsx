import type { CompressionMode } from '../types';
export function CompressionControls({ mode, quality, auto, onMode, onQuality, onAuto }: { mode: CompressionMode; quality: number; auto: boolean; onMode:(m:CompressionMode)=>void; onQuality:(q:number)=>void; onAuto:(v:boolean)=>void }) {
  return <section className="rounded-2xl border bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex rounded-xl bg-slate-100 p-1">{(['lossless','smart','custom'] as CompressionMode[]).map(m => <button key={m} onClick={() => onMode(m)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${mode===m?'bg-white shadow-sm':'text-slate-500'}`}>{m}</button>)}</div>
    <label className="flex items-center gap-2 text-sm"><span className="text-slate-500">Auto Compress</span><input type="checkbox" checked={auto} onChange={e=>onAuto(e.target.checked)} className="h-4 w-4 accent-slate-950"/></label></div>
    <p className="mt-3 text-sm text-slate-500">{mode==='lossless'?'WebP lossless preserves decoded pixel data.':mode==='smart'?'Smart compression finds a smaller WebP while keeping visual quality very close to the original.':'Use the exact WebP quality you choose.'}</p>
    {mode==='custom' && <div className="mt-4 flex items-center gap-4"><input className="w-full accent-slate-950" type="range" min="1" max="100" value={quality} onChange={e=>onQuality(Number(e.target.value))}/><span className="w-10 text-right font-semibold">{quality}</span></div>}
  </section>;
}
