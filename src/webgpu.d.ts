interface Navigator { gpu?: GPU; }
interface GPU { requestAdapter(options?: { powerPreference?: 'low-power' | 'high-performance' }): Promise<GPUAdapter | null>; }
interface GPUAdapter { requestDevice(): Promise<GPUDevice>; }
interface GPUDevice { lost: Promise<unknown>; destroy(): void; }
