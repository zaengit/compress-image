import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/compress-image/',
  plugins: [react()],
  worker: { format: 'es' },
  build: { target: 'es2022' },
});
