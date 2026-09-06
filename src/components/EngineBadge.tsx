import { Cpu, Zap } from 'lucide-react';
export function EngineBadge({ gpu, checking=false }: { gpu:boolean; checking?:boolean }) { return <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-medium">{gpu?<Zap size={14}/>:<Cpu size={14}/>} {checking?'Detecting engine…':gpu?'WebGPU Accelerated':'WASM CPU'}</span>; }
