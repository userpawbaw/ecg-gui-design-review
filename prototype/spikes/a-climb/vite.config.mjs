import {defineConfig} from 'vite';import {fileURLToPath} from 'node:url';import fs from 'node:fs/promises';import path from 'node:path';
const reviewRoot=fileURLToPath(new URL('../../../verification/a-cloud-sculpt-20261006/native-captures/',import.meta.url));
const terrainReviewRoot=fileURLToPath(new URL('../../../verification/a-terrain-lod-20261007/native-captures/',import.meta.url));
const northReviewRoot=fileURLToPath(new URL('../../../verification/a-north-handoff-20261007/native-captures/',import.meta.url));
const northMorphRoot=fileURLToPath(new URL('../../../verification/a-north-morph-20261007/native-captures/',import.meta.url));
const reviewPlugin={name:'local-cloud-review',configureServer(server){server.middlewares.use('/__cloud_review_save',async(req,res)=>{
 if(req.method!=='POST'||req.headers.origin!=='http://127.0.0.1:4198'||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.statusCode=403;res.end('local review only');return;}
 try{
  let chunks=[],length=0;for await(const c of req){length+=c.length;if(length>20*1024*1024)throw Error('capture too large');chunks.push(c);}
  const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!/^[a-z0-9_-]{1,60}$/.test(data.round)||!/^[a-z0-9_-]{1,80}$/.test(data.shot))throw Error('invalid capture');
  const video=typeof data.video==='string',media=video?data.video:data.image;
  if(typeof media!=='string'||!(video?/^data:video\/webm(?:;codecs=[^;,]+)?;base64,/.test(media):media.startsWith('data:image/png;base64,')))throw Error('invalid media');
  const bytes=Buffer.from(media.split(',')[1],'base64');
  if(video&&!bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))throw Error('invalid WebM');
  const folder=data.round==='north-morph'?northMorphRoot:data.round==='north-handoff'?northReviewRoot:data.round==='terrain-lod'?terrainReviewRoot:path.join(reviewRoot,data.round);
  const extension=video?'.webm':'.png';await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,data.shot+extension),bytes);await fs.writeFile(path.join(folder,data.shot+'.json'),JSON.stringify(data.meta,null,2));
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({saved:true,file:data.shot+extension}));
 }catch(e){res.statusCode=400;res.end(String(e.message));}
});}};
export default defineConfig({build:{rollupOptions:{input:{main:fileURLToPath(new URL('./index.html',import.meta.url)),terrain:fileURLToPath(new URL('./terrain.html',import.meta.url)),cloudLab:fileURLToPath(new URL('./cloud-lab.html',import.meta.url)),gpuCheck:fileURLToPath(new URL('./gpu-check.html',import.meta.url))}}},plugins:[reviewPlugin],resolve:{alias:[{find:'three/addons',replacement:fileURLToPath(new URL('./node_modules/three/examples/jsm',import.meta.url))},{find:/^three$/,replacement:fileURLToPath(new URL('./node_modules/three/build/three.module.js',import.meta.url))}]},server:{fs:{allow:[fileURLToPath(new URL('../../..',import.meta.url))]}}});
