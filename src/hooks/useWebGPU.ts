import { useEffect, useState } from 'react';
import { detectWebGPU } from '../lib/webgpu-engine';

export function useWebGPU() {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => { let alive = true; detectWebGPU().then(v => alive && setAvailable(v)).finally(() => alive && setChecking(false)); return () => { alive = false; }; }, []);
  return { available, checking };
}
