import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({base:'./',plugins:[react(),tailwind()],build:{outDir:'../../dist/v2',emptyOutDir:true},server:{host:'127.0.0.1'}});
