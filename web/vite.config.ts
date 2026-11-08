import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' = semua aset relatif, aman di GitHub Pages (sub-path /<nama-repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true },
  test: { environment: 'node', testTimeout: 180_000 },
});
