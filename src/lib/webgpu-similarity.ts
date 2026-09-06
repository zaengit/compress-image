const WORKGROUP_SIZE = 256;
const FLOATS_PER_GROUP = 8;

const shader = /* wgsl */ `
struct Params { pixelCount: u32, _pad0: u32, _pad1: u32, _pad2: u32 }
struct Stats { sumA: f32, sumB: f32, sumAA: f32, sumBB: f32, sumAB: f32, count: f32, _pad0: f32, _pad1: f32 }

@group(0) @binding(0) var<storage, read> imageA: array<u32>;
@group(0) @binding(1) var<storage, read> imageB: array<u32>;
@group(0) @binding(2) var<storage, read_write> output: array<Stats>;
@group(0) @binding(3) var<uniform> params: Params;

var<workgroup> sumA: array<f32, ${WORKGROUP_SIZE}>;
var<workgroup> sumB: array<f32, ${WORKGROUP_SIZE}>;
var<workgroup> sumAA: array<f32, ${WORKGROUP_SIZE}>;
var<workgroup> sumBB: array<f32, ${WORKGROUP_SIZE}>;
var<workgroup> sumAB: array<f32, ${WORKGROUP_SIZE}>;
var<workgroup> count: array<f32, ${WORKGROUP_SIZE}>;

fn luminance(pixel: u32) -> f32 {
  let r = f32(pixel & 255u);
  let g = f32((pixel >> 8u) & 255u);
  let b = f32((pixel >> 16u) & 255u);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>, @builtin(workgroup_id) wid: vec3<u32>) {
  let i = gid.x;
  let l = lid.x;
  if (i < params.pixelCount) {
    let a = luminance(imageA[i]);
    let b = luminance(imageB[i]);
    sumA[l] = a;
    sumB[l] = b;
    sumAA[l] = a * a;
    sumBB[l] = b * b;
    sumAB[l] = a * b;
    count[l] = 1.0;
  } else {
    sumA[l] = 0.0; sumB[l] = 0.0; sumAA[l] = 0.0; sumBB[l] = 0.0; sumAB[l] = 0.0; count[l] = 0.0;
  }
  workgroupBarrier();

  var stride = ${WORKGROUP_SIZE / 2}u;
  loop {
    if (l < stride) {
      sumA[l] += sumA[l + stride]; sumB[l] += sumB[l + stride];
      sumAA[l] += sumAA[l + stride]; sumBB[l] += sumBB[l + stride];
      sumAB[l] += sumAB[l + stride]; count[l] += count[l + stride];
    }
    workgroupBarrier();
    if (stride == 1u) { break; }
    stride = stride / 2u;
  }

  if (l == 0u) {
    output[wid.x] = Stats(sumA[0], sumB[0], sumAA[0], sumBB[0], sumAB[0], count[0], 0.0, 0.0);
  }
}
`;

export class WebGPUSimilarity {
  private pipeline: GPUComputePipeline;

  constructor(private device: GPUDevice) {
    const module = device.createShaderModule({ code: shader });
    this.pipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });
  }

  async ssim(a: Uint8ClampedArray, b: Uint8ClampedArray): Promise<number> {
    if (a.byteLength !== b.byteLength || a.byteLength % 4 !== 0) throw new Error('SSIM RGBA buffers differ');
    const pixelCount = a.byteLength / 4;
    if (pixelCount < 2) return 1;
    const groups = Math.ceil(pixelCount / WORKGROUP_SIZE);
    const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
    const aBuffer = this.device.createBuffer({ size: a.byteLength, usage });
    const bBuffer = this.device.createBuffer({ size: b.byteLength, usage });
    const outputSize = groups * FLOATS_PER_GROUP * 4;
    const output = this.device.createBuffer({ size: outputSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
    const readback = this.device.createBuffer({ size: outputSize, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const params = this.device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    try {
      this.device.queue.writeBuffer(aBuffer, 0, a.buffer, a.byteOffset, a.byteLength);
      this.device.queue.writeBuffer(bBuffer, 0, b.buffer, b.byteOffset, b.byteLength);
      this.device.queue.writeBuffer(params, 0, new Uint32Array([pixelCount, 0, 0, 0]));
      const bindGroup = this.device.createBindGroup({ layout: this.pipeline.getBindGroupLayout(0), entries: [
        { binding: 0, resource: { buffer: aBuffer } }, { binding: 1, resource: { buffer: bBuffer } },
        { binding: 2, resource: { buffer: output } }, { binding: 3, resource: { buffer: params } },
      ] });
      const encoder = this.device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.pipeline); pass.setBindGroup(0, bindGroup); pass.dispatchWorkgroups(groups); pass.end();
      encoder.copyBufferToBuffer(output, 0, readback, 0, outputSize);
      this.device.queue.submit([encoder.finish()]);
      await readback.mapAsync(GPUMapMode.READ);
      const values = new Float32Array(readback.getMappedRange().slice(0));
      let sa=0,sb=0,saa=0,sbb=0,sab=0,n=0;
      for (let i=0;i<groups;i++) { const o=i*FLOATS_PER_GROUP; sa+=values[o]; sb+=values[o+1]; saa+=values[o+2]; sbb+=values[o+3]; sab+=values[o+4]; n+=values[o+5]; }
      const ma=sa/n, mb=sb/n;
      const va=(saa-n*ma*ma)/(n-1), vb=(sbb-n*mb*mb)/(n-1), cov=(sab-n*ma*mb)/(n-1);
      const c1=(0.01*255)**2, c2=(0.03*255)**2;
      return ((2*ma*mb+c1)*(2*cov+c2))/((ma*ma+mb*mb+c1)*(va+vb+c2));
    } finally {
      readback.unmap(); aBuffer.destroy(); bBuffer.destroy(); output.destroy(); readback.destroy(); params.destroy();
    }
  }
}
