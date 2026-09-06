# Compress Image

A production-oriented, privacy-first browser image compressor built with React, TypeScript, Tailwind CSS, Rust/WASM, WebP, Web Workers, and automatic WebGPU detection.

## What it does

- Multi-image drag/drop and file picker for JPEG, PNG, and WebP.
- Lossless WebP mode for decoded-pixel fidelity.
- Smart mode tests qualities `95, 92, 90, 87, 85, 82, 80` and selects the smallest candidate meeting the configured SSIM threshold (default `0.98`). Smart mode is **not lossless**.
- Custom WebP quality from 1–100.
- Optional pre-encode resize.
- Worker pool capped at `min(hardwareConcurrency - 1, 4)`.
- Automatic WebGPU detection with transparent WASM CPU fallback.
- WebGPU compute shader acceleration for Smart-mode luminance statistics and SSIM when supported.
- Individual downloads and ZIP download with duplicate-safe names.
- No server upload: images stay in the browser.

## Architecture

```text
React UI
  ↓
CompressionManager
  ↓
Web Worker pool
  ↓
ProcessingEngine
  ├─ WebGPUProcessingEngine
  │    ├─ WGSL compute: Smart SSIM statistics
  │    └─ Rust/WASM: WebP codec
  └─ WasmProcessingEngine
       └─ Rust/WASM: decode / resize / WebP / CPU SSIM
```

WebGPU is deliberately not claimed as the WebP codec: browsers do not expose a WebGPU-native WebP encoder. In Smart mode, the GPU path performs parallel luminance/statistical reduction in WGSL and sends only per-workgroup aggregates back to JavaScript for the final SSIM calculation. If device creation, shader execution, image decode, or GPU readback fails, processing falls back to the existing Rust/WASM Smart implementation without failing the image.

## Prerequisites

- Node.js 20+
- Rust stable
- `wasm-pack`: `cargo install wasm-pack`

## Local development

```bash
npm install
npm run build:wasm
npm run dev
```

Open the Vite URL shown in the terminal.

## Production build

```bash
npm install
npm run build
npm run preview
```

`npm run build` builds the Rust crate into `src/wasm/`, type-checks TypeScript, then creates the Vite production bundle in `dist/`.

> The repository currently does not commit a `package-lock.json`, so use `npm install` rather than `npm ci`. Once a lockfile is committed, CI and production installs should switch to `npm ci` for fully locked dependency resolution.

## Continuous integration

GitHub Actions runs on pushes to `main` and pull requests. CI installs Node.js and Rust, checks the Rust crate for the `wasm32-unknown-unknown` target, builds the WASM package with `wasm-pack`, type-checks the React application, and produces the Vite production bundle.

## Rust/WASM only

```bash
wasm-pack build crates/image-compressor --target web --out-dir ../../src/wasm --release
```

## Smart quality details

### WASM CPU path

Rust decodes the source once, encodes each candidate, decodes it, and evaluates luminance SSIM through the replaceable `similarity` module.

### WebGPU path

The worker encodes the same Smart candidate qualities through Rust/WASM, decodes candidate pixels with browser image primitives, and compares them to the resized source using a WGSL compute shader. Each workgroup reduces pixel data into sums for luminance, squared luminance, and cross-products; JavaScript performs only the small final aggregate-to-SSIM calculation. The smallest candidate meeting the threshold is selected, or Q95 if none pass.

The similarity layer remains isolated so windowed SSIM, MS-SSIM, or another perceptual metric can replace the current global luminance SSIM later.

## Privacy

There is no upload API and no backend dependency in this repository. Compression, similarity evaluation, resize, and packaging happen locally in the browser.
