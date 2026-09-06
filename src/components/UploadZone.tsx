import { ImagePlus, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

export function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null); const [drag, setDrag] = useState(false);
  return <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); onFiles([...e.dataTransfer.files]); }} className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? 'border-sky-500 bg-sky-50 scale-[1.01]' : 'border-slate-300 bg-white'}`}>
    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white"><UploadCloud /></div>
    <h2 className="text-lg font-semibold">Drop images here</h2><p className="mt-1 text-sm text-slate-500">JPEG, PNG, or WebP · multiple files supported</p>
    <button onClick={() => input.current?.click()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><ImagePlus size={17}/> Choose images</button>
    <input ref={input} hidden type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => onFiles([...e.target.files ?? []])}/>
  </div>;
}
