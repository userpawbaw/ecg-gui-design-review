import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({base:'./',plugins:[react(),tailwind()],build:{outDir:'../../dist/v2',emptyOutDir:true},server:{host:'127.0.0.1',
 // D-157: the live tab reads the source repo bridge (scripts/serial_bridge.py --serve) through this same-origin proxy — the bridge
 // sends no CORS headers. ECG_BRIDGE overrides the address.
 proxy:{'/bridge':{target:process.env.ECG_BRIDGE||'http://127.0.0.1:8765',changeOrigin:true,rewrite:p=>p.replace(/^\/bridge/,'')}}}});
