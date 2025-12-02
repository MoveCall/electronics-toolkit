import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for assets, critical for GitHub Pages
  build: {
    outDir: 'dist',
  },
});