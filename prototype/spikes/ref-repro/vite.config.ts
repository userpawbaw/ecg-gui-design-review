import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base: './', build: {outDir: 'dist', assetsInlineLimit: 0,
  rollupOptions: {input: {index: resolve(__dirname, 'index.html'), white: resolve(__dirname, 'ref003.html'), globe: resolve(__dirname, 'ref004.html')}}}});
