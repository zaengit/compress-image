import type { ResizeOptions } from '../types';
export function AdvancedSettings({ value, onChange }: { value: ResizeOptions; onChange:(v:ResizeOptions)=>void }) {
  return <details className="rounded-2xl border bg-white p-4 shadow-sm"><summary className="cursor-pointer font-semibold">Advanced settings</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Resize mode<select value={value.kind} onChange={e=>onChange({...value,kind:e.target.value as ResizeOptions['kind']})} className="mt-1 w-full rounded-xl border p-2.5"><option value="original">Keep original size</option><option value="width">Custom width</option><option value="height">Custom height</option><option value="max-width">Max width</option><option value="max-height">Max height</option></select></label>
    {value.kind!=='original' && <label className="text-sm">Pixels<input value={value.value ?? ''} min={1} type="number" onChange={e=>onChange({...value,value:Number(e.target.value)||undefined})} className="mt-1 w-full rounded-xl border p-2.5"/></label>}
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.maintainAspectRatio} onChange={e=>onChange({...value,maintainAspectRatio:e.target.checked})}/>Maintain aspect ratio</label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.preventEnlargement} onChange={e=>onChange({...value,preventEnlargement:e.target.checked})}/>Prevent enlargement</label>
  </div></details>;
}
