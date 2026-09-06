import type { ResizeOptions } from '../types';

export function AdvancedSettings({ value, onChange }: { value: ResizeOptions; onChange:(v:ResizeOptions)=>void }) {
  return (
    <details className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-6">
      <summary className="cursor-pointer list-none">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Advanced</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">Resize settings</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">Optionally resize before WebP encoding.</p>
          </div>
          <span className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">Open</span>
        </div>
      </summary>

      <div className="mt-5 grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Resize mode
          <select value={value.kind} onChange={e=>onChange({...value,kind:e.target.value as ResizeOptions['kind']})} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none transition focus:border-neutral-950">
            <option value="original">Keep original size</option>
            <option value="width">Custom width</option>
            <option value="height">Custom height</option>
            <option value="max-width">Max width</option>
            <option value="max-height">Max height</option>
          </select>
        </label>
        {value.kind!=='original' && (
          <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
            Pixels
            <input value={value.value ?? ''} min={1} type="number" onChange={e=>onChange({...value,value:Number(e.target.value)||undefined})} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none transition focus:border-neutral-950"/>
          </label>
        )}
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
          <input className="accent-neutral-950" type="checkbox" checked={value.maintainAspectRatio} onChange={e=>onChange({...value,maintainAspectRatio:e.target.checked})}/>
          Maintain aspect ratio
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
          <input className="accent-neutral-950" type="checkbox" checked={value.preventEnlargement} onChange={e=>onChange({...value,preventEnlargement:e.target.checked})}/>
          Prevent enlargement
        </label>
      </div>
    </details>
  );
}
