import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({base: './', plugins: [react(), tailwind()], resolve: {alias: {'@': resolve(__dirname, 'src')}},
  build: {outDir: 'dist', assetsInlineLimit: 0,
    rollupOptions: {input: {index: resolve(__dirname, 'index.html'), white: resolve(__dirname, 'ref003.html'), whiteB: resolve(__dirname, 'ref003b.html'), globe: resolve(__dirname, 'ref004.html')}}}});
