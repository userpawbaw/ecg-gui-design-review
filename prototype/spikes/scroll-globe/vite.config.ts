import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',assetsInclude:['**/*.exr','**/*.glb'],
 server:{fs:{allow:[resolve(__dirname,'../../..')]}},
 build:{outDir:'dist',assetsInlineLimit:0,rollupOptions:{input:{main:resolve(__dirname,'index.html'),assets:resolve(__dirname,'asset-test.html')}}}});
