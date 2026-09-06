import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, LockKeyhole, Trash2 } from 'lucide-react';
import { BlobWriter, Uint8ArrayReader, ZipWriter } from '@zip.js/zip.js';
import { UploadZone } from './components/UploadZone'; import { CompressionControls } from './components/CompressionControls'; import { AdvancedSettings } from './components/AdvancedSettings'; import { EngineBadge } from './components/EngineBadge'; import { BatchStats } from './components/BatchStats'; import { ImageCard } from './components/ImageCard'; import { ThemeToggle } from './components/ThemeToggle';
import { ACCEPTED_TYPES, readBrowserMetadata, uniqueWebpNames } from './lib/files'; import { CompressionManager } from './lib/compression-manager'; import type { CompressionMode, CompressionSettings, ImageItem, ResizeOptions } from './types'; import { useWebGPU } from './hooks/useWebGPU';

const defaultResize: ResizeOptions = { kind:'original', maintainAspectRatio:true, preventEnlargement:true };
function ownedBuffer(bytes: Uint8Array): ArrayBuffer { const copy = new Uint8Array(bytes.byteLength); copy.set(bytes); return copy.buffer; }

export default function App() {
  const { available: gpu, checking } = useWebGPU(); const manager = useRef<CompressionManager | null>(null); const itemsRef = useRef<ImageItem[]>([]);
  const [items,setItems]=useState<ImageItem[]>([]); const [mode,setMode]=useState<CompressionMode>('custom'); const [quality,setQuality]=useState(85); const [auto,setAuto]=useState(false); const [resize,setResize]=useState<ResizeOptions>({...defaultResize});
  useEffect(()=>{itemsRef.current=items;},[items]);
  useEffect(()=>{ manager.current?.destroy(); manager.current=new CompressionManager(gpu); return()=>{ manager.current?.destroy(); manager.current=null; }; },[gpu]);
  useEffect(()=>()=>itemsRef.current.forEach(i=>URL.revokeObjectURL(i.previewUrl)),[]);
  const settings:CompressionSettings=useMemo(()=>({mode,quality,smartThreshold:.98,resize}),[mode,quality,resize]);

  const compressOne=useCallback(async(id:string, customSettings=settings)=>{ const item=itemsRef.current.find(i=>i.id===id); if(!item||!manager.current||item.status==='compressing')return; setItems(xs=>xs.map(x=>x.id===id?{...x,status:'compressing',progress:5,error:undefined}:x)); try{const result=await manager.current.compress(item.file,customSettings,p=>setItems(xs=>xs.map(x=>x.id===id?{...x,progress:p}:x)));setItems(xs=>xs.map(x=>x.id===id?{...x,status:'done',progress:100,result}:x));}catch(e){setItems(xs=>xs.map(x=>x.id===id?{...x,status:'error',progress:0,error:e instanceof Error?e.message:String(e)}:x));}},[settings]);
  const addFiles=useCallback(async(files:File[])=>{ const valid=files.filter(f=>ACCEPTED_TYPES.has(f.type)); const added:ImageItem[]=valid.map(file=>({id:crypto.randomUUID(),file,previewUrl:URL.createObjectURL(file),meta:null,status:'queued',progress:0})); if(!added.length)return; setItems(xs=>[...xs,...added]); for(const it of added){try{const meta=await readBrowserMetadata(it.file);setItems(xs=>xs.map(x=>x.id===it.id?{...x,meta}:x));}catch{setItems(xs=>xs.map(x=>x.id===it.id?{...x,status:'error',error:'Could not decode image metadata'}:x));}} if(auto) requestAnimationFrame(()=>added.forEach(it=>compressOne(it.id,settings))); },[auto,compressOne,settings]);
  const clear=()=>{items.forEach(i=>URL.revokeObjectURL(i.previewUrl));setItems([]);};
  const remove=(id:string)=>setItems(xs=>{const hit=xs.find(x=>x.id===id);if(hit)URL.revokeObjectURL(hit.previewUrl);return xs.filter(x=>x.id!==id);});
  const download=(item:ImageItem)=>{if(!item.result)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ownedBuffer(item.result.bytes)],{type:'image/webp'}));a.download=item.file.name.replace(/\.[^.]+$/,'')+'.webp';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  const downloadAll=async()=>{const done=items.filter(i=>i.result);if(!done.length)return;if(done.length===1){download(done[0]);return;}const names=uniqueWebpNames(done.map(i=>i.file));const zip=new ZipWriter(new BlobWriter('application/zip'));for(let i=0;i<done.length;i++)await zip.add(names[i],new Uint8ArrayReader(done[i].result!.bytes));const blob=await zip.close();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='compressed-images.zip';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  const busy=items.some(i=>i.status==='compressing'); const done=items.filter(i=>i.result).length;

  return <main className="app-shell theme-surface min-h-screen bg-[#f4f4f2] px-4 py-4 text-neutral-950 transition-colors sm:px-6 sm:py-6 lg:px-8 pb-28">
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-2xl font-extrabold tracking-[-0.04em] text-neutral-950" aria-label="Compress">Compress</div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 sm:inline-flex"><LockKeyhole size={13}/>Local only</span>
          <EngineBadge gpu={gpu} checking={checking}/>
          <ThemeToggle/>
        </div>
      </div>

      <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">01 / Upload</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">Compress images without uploading them</h1>
          <p className="mt-3 text-base leading-7 text-neutral-600">Create smaller WebP files directly in your browser. Your images never leave your device.</p>
        </div>
        <div className="mt-6"><UploadZone onFiles={addFiles}/></div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]"><CompressionControls mode={mode} quality={quality} auto={auto} onMode={setMode} onQuality={setQuality} onAuto={setAuto}/><AdvancedSettings value={resize} onChange={setResize}/></div>

      {items.length>0&&<section id="results" className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">03 / Results</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Compressed batch</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">Review file savings, quality, processing engine, and download results.</p>
          </div>
          <button onClick={clear} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"><Trash2 size={16}/>Clear all</button>
        </div>
        <div className="mt-5"><BatchStats items={items}/></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{items.map(item=><ImageCard key={item.id} item={item} onRemove={()=>remove(item.id)} onDownload={()=>download(item)}/>)}</div>
      </section>}
    </div>

    {items.length>0&&<div className="theme-bottom-bar fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-[#f4f4f2]/95 p-3 backdrop-blur"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3"><div className="text-sm font-medium text-neutral-500">{done}/{items.length} compressed</div><div className="flex gap-2"><button disabled={busy} onClick={()=>items.filter(i=>i.status!=='compressing').forEach(i=>compressOne(i.id))} className="min-h-11 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">Compress all</button><button disabled={!done} onClick={downloadAll} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"><Download size={16}/>Download all</button></div></div></div>}
  </main>;
}
