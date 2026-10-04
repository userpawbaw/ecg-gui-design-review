import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=dirname(fileURLToPath(import.meta.url));
const sourceRoot=resolve(root,'../../v2/src/story/intro');
const assets={'/model/body.glb':'body.glb','/model/heart.glb':'heart.glb','/model/figure.json':'figure.json'};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/h5.js'){
   const source=await readFile(resolve(sourceRoot,'figure.ts'),'utf8');
   const extracts=['h5Vert','h5Frag'].map(name=>{
    const expression=new RegExp('const '+name+'=\/\\* glsl \\*\/'+'`'+'([\\s\\S]*?)'+'`;');
    const found=source.match(expression);if(!found)throw Error('H5 source extraction failed');
    return 'export const '+name+'='+JSON.stringify(found[1])+';';
   });
   res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(extracts.join('\n'));return;
  }
  if(assets[url.pathname]){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.json')?'application/json':'model/gltf-binary','Cache-Control':'no-store'});res.end(await readFile(resolve(sourceRoot,'assets',assets[url.pathname])));return;}
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('파일이 없습니다. 저장소 루트에서 npm run spike -- background-space 로 준비하세요.');}
});
server.listen(4196,'127.0.0.1',()=>{
 console.log('ECG 배경 3D 프리비즈 http://127.0.0.1:4196');
 if(process.argv.includes('--open')){
  const url='http://127.0.0.1:4196';
  const args=process.platform==='win32'?['/c','start','',url]:[url];
  spawn(process.platform==='win32'?'cmd':process.platform==='darwin'?'open':'xdg-open',args,{stdio:'ignore'}).on('error',()=>{});
 }
});
