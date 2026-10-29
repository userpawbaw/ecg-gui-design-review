/** Lossless meshopt transport only. No quantization, reordering or simplification.
 * Reuses pinned meshoptimizer 0.22 (MIT); every decoded buffer view must equal input bytes.
 */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import crypto from 'node:crypto';
import {MeshoptEncoder,MeshoptDecoder} from '../../prototype/v2/node_modules/meshoptimizer/index.module.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'verification/r1-reference-attic-clone-20261030'),file=path.join(out,'attic-clone.glb');
const input=fs.readFileSync(file),jsonLength=input.readUInt32LE(12),doc=JSON.parse(input.subarray(20,20+jsonLength)),binStart=20+jsonLength+8,bin=input.subarray(binStart);
if(doc.extensionsUsed?.includes('EXT_meshopt_compression'))throw Error('Already compressed; regenerate the authored GLB before recompressing.');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const chunks=[],rows=[];let offset=0;
for(let i=0;i<doc.bufferViews.length;i++){
 const view=doc.bufferViews[i],accessors=doc.accessors.filter(a=>a.bufferView===i);if(accessors.length!==1)throw Error('Expected one packed accessor per view');const ac=accessors[0],count=ac.count,stride=view.byteLength/count;
 const mode=view.target===34963?'INDICES':'ATTRIBUTES',source=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength),encoded=MeshoptEncoder.encodeGltfBuffer(source,count,stride,mode),decoded=new Uint8Array(source.length);
 MeshoptDecoder.decodeGltfBuffer(decoded,count,stride,encoded,mode,'NONE');if(!Buffer.from(decoded).equals(source))throw Error('Lossless check failed: '+i);
 view.buffer=1;view.extensions={EXT_meshopt_compression:{buffer:0,byteOffset:offset,byteLength:encoded.length,byteStride:stride,count,mode,filter:'NONE'}};
 chunks.push(Buffer.from(encoded));offset+=encoded.length;const padding=(4-offset%4)%4;if(padding){chunks.push(Buffer.alloc(padding));offset+=padding;}
 rows.push({view:i,count,stride,mode,input_bytes:source.length,compressed_bytes:encoded.length,decoded_exact:true});
}
doc.buffers=[{byteLength:offset},{byteLength:doc.buffers[0].byteLength,extensions:{EXT_meshopt_compression:{fallback:true}}}];doc.extensionsUsed=['EXT_meshopt_compression'];doc.extensionsRequired=['EXT_meshopt_compression'];
let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const packed=Buffer.concat(chunks),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+json.length+8+packed.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(packed.length,0);bh.writeUInt32LE(0x004e4942,4);const result=Buffer.concat([header,json,bh,packed]);
fs.mkdirSync('/tmp/ecg-authored-attic',{recursive:true});fs.writeFileSync('/tmp/ecg-authored-attic/uncompressed.glb',input);fs.writeFileSync(file+'.tmp',result);fs.renameSync(file+'.tmp',file);
const report={encoder:'meshoptimizer 0.22.0 (MIT)',scope:'All POSITION/NORMAL/UV/index views bit-exact after decode; no quantization, simplification or index rotation',input_bytes:input.length,output_bytes:result.length,reduction_percent:100*(1-result.length/input.length),input_sha256:crypto.createHash('sha256').update(input).digest('hex'),output_sha256:crypto.createHash('sha256').update(result).digest('hex'),views:rows};fs.writeFileSync(path.join(out,'mesh-compression-result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({input:input.length,output:result.length,reduction_percent:report.reduction_percent,views:rows.length}));
