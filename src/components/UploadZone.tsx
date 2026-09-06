import { ImagePlus, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

export function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <section
      onDragEnter={e => { e.preventDefault(); setDrag(true); }}
      onDragOver={e => e.preventDefault()}
      onDragLeave={e => { e.preventDefault(); setDrag(false); }}
      onDrop={e => { e.preventDefault(); setDrag(false); onFiles([...e.dataTransfer.files]); }}
      className={`group rounded-[28px] border border-dashed p-6 text-center transition sm:p-8 ${drag ? 'border-neutral-950 bg-neutral-100' : 'border-neutral-300 bg-white hover:border-neutral-950'}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-lg shadow-neutral-300 transition group-hover:-translate-y-0.5">
        <UploadCloud size={24} strokeWidth={1.8} />
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight text-neutral-950">Drop images to get started</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-neutral-600">Process JPEG, PNG, and WebP files locally. Multiple images are supported in one batch.</p>
      <button onClick={() => input.current?.click()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 font-semibold text-white shadow-lg shadow-neutral-200 transition hover:bg-neutral-800">
        <ImagePlus size={17}/> Choose images
      </button>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">JPEG · PNG · WebP · Multi image</p>
      <input ref={input} hidden type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => { onFiles([...e.target.files ?? []]); e.currentTarget.value = ''; }}/>
    </section>
  );
}
