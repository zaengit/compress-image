import type { CompressionMode } from '../types';

export function CompressionControls({ mode, quality, auto, onMode, onQuality, onAuto }: { mode: CompressionMode; quality: number; auto: boolean; onMode:(m:CompressionMode)=>void; onQuality:(q:number)=>void; onAuto:(v:boolean)=>void }) {
  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">02 / Compress</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Choose compression mode</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">Pick the balance you want between file size and visual fidelity.</p>
        </div>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700">
          <input type="checkbox" checked={auto} onChange={e=>onAuto(e.target.checked)} className="accent-neutral-950" />
          Auto compress
        </label>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {(['lossless','smart','custom'] as CompressionMode[]).map(m => (
          <button
            key={m}
            onClick={() => onMode(m)}
            aria-pressed={mode === m}
            className={`rounded-xl border px-4 py-3 text-left transition ${mode===m ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:border-neutral-950 hover:bg-white'}`}
          >
            <span className="block text-sm font-semibold capitalize">{m}</span>
            <span className={`mt-1 block text-xs leading-5 ${mode===m ? 'text-neutral-300' : 'text-neutral-500'}`}>{m==='lossless' ? 'Exact decoded pixels' : m==='smart' ? 'Adaptive quality with SSIM' : 'Manual quality control'}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm leading-6 text-neutral-600">{mode==='lossless' ? 'WebP lossless preserves decoded pixel data.' : mode==='smart' ? 'Smart compression searches for a smaller WebP while keeping visual quality very close to the original.' : 'Use the exact WebP quality you choose.'}</p>
        {mode==='custom' && (
          <div className="mt-4 flex items-center gap-4">
            <input className="w-full accent-neutral-950" type="range" min="1" max="100" value={quality} onChange={e=>onQuality(Number(e.target.value))}/>
            <span className="min-w-12 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-center text-sm font-semibold">{quality}</span>
          </div>
        )}
      </div>
    </section>
  );
}
