interface Navigator { gpu?: GPU; }
interface GPU { requestAdapter(options?: { powerPreference?: 'low-power' | 'high-performance' }): Promise<GPUAdapter | null>; }
interface GPUAdapter { requestDevice(): Promise<GPUDevice>; }
interface GPUShaderModule {}
interface GPUBindGroupLayout {}
interface GPUComputePipeline { getBindGroupLayout(index:number): GPUBindGroupLayout; }
interface GPUBuffer { mapAsync(mode:number): Promise<void>; getMappedRange(): ArrayBuffer; unmap(): void; destroy(): void; }
interface GPUBindGroup {}
interface GPUCommandBuffer {}
interface GPUComputePassEncoder { setPipeline(pipeline:GPUComputePipeline):void; setBindGroup(index:number,group:GPUBindGroup):void; dispatchWorkgroups(x:number):void; end():void; }
interface GPUCommandEncoder { beginComputePass(): GPUComputePassEncoder; copyBufferToBuffer(source:GPUBuffer,sourceOffset:number,destination:GPUBuffer,destinationOffset:number,size:number):void; finish(): GPUCommandBuffer; }
interface GPUQueue { writeBuffer(buffer:GPUBuffer,bufferOffset:number,data:ArrayBufferLike | ArrayBufferView,dataOffset?:number,size?:number):void; submit(commands:GPUCommandBuffer[]):void; }
interface GPUDevice {
  lost: Promise<unknown>;
  queue: GPUQueue;
  destroy(): void;
  createShaderModule(descriptor:{code:string}): GPUShaderModule;
  createComputePipeline(descriptor:{layout:'auto';compute:{module:GPUShaderModule;entryPoint:string}}): GPUComputePipeline;
  createBuffer(descriptor:{size:number;usage:number}): GPUBuffer;
  createBindGroup(descriptor:{layout:GPUBindGroupLayout;entries:Array<{binding:number;resource:{buffer:GPUBuffer}}> }): GPUBindGroup;
  createCommandEncoder(): GPUCommandEncoder;
}
declare const GPUBufferUsage: { STORAGE:number; COPY_DST:number; COPY_SRC:number; MAP_READ:number; UNIFORM:number };
declare const GPUMapMode: { READ:number };
