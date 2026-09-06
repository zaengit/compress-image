# Compress Image

A production-oriented, privacy-first browser image compressor built with React, TypeScript, Tailwind CSS, Rust/WASM, WebP, Web Workers, and automatic WebGPU detection.

## What it does

- Multi-image drag/drop and file picker for JPEG, PNG, and WebP.
- Lossless WebP mode for decoded-pixel fidelity.
- Smart mode tests qualities `95, 92, 90, 87, 85, 82, 80` and selects the smallest candidate meeting the configured SSIM threshold (default `0.98`). Smart mode is **not lossless**.
- Custom WebP quality from 1–100.
- Optional pre-encode resize.
- Worker pool capped at `min(hardwareConcurrency - 1, 4)`.
- Automatic WebGPU availability detection with transparent WASM CPU fallback.
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
  ├─ WebGPUProcessingEngine (hybrid GPU readiness + WASM codec)
  └─ WasmProcessingEngine
  ↓
Rust decoder / resize / WebP encoder / Smart SSIM search
```

WebGPU is deliberately not claimed as the WebP codec: browsers do not expose a WebGPU-native WebP encoder. The abstraction is ready for compute shaders for resize/SSIM as they become measurably beneficial, while Rust/WASM owns deterministic image codec work today.

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

The original image is decoded once and kept in memory. Each Smart candidate is encoded to WebP, decoded, and compared against the decoded original through the `similarity` module. The current implementation uses luminance SSIM behind a replaceable interface; windowed SSIM, MS-SSIM, or another perceptual metric can be added later without changing the UI or manager layer.

## Privacy

There is no upload API and no backend dependency in this repository. Compression, similarity evaluation, resize, and packaging happen locally in the browser.
