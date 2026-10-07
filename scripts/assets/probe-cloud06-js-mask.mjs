// REJECT: getValue returns occupancy mask, not scalar density. Diagnostic only.
// D100: actual JangaFX cloud06, index samples; no procedural density substitution.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
const {loadVDB}=await import(pathToFileURL(path.join(root,'.tools/vdb-js/package/index.js')));
const {Vector3}=await import(pathToFileURL(path.join(root,'.tools/vdb-js/node_modules/three/build/three.module.js')));
const file=path.join(root,'assets/source/jangafx-cloud-pack/unpacked/CloudPack/CloudPackVDB/cloud_06_variant_0000.vdb');
const raw=fs.readFileSync(file),reader=await loadVDB('data:application/octet-stream;base64,'+raw.toString('base64'));
const grid=reader.grids.density,lo=grid.metadata.file_bbox_min.value,hi=grid.metadata.file_bbox_max.value;
const dims=[128,64,192],data=new Float32Array(dims.reduce((a,b)=>a*b)),v=new Vector3();let max=0,min=Infinity,positive=0;
// Native Z is height, native Y becomes negative WebGL Z; x-fast WebGL volume layout.
for(let z=0;z<dims[2];z++){for(let y=0;y<dims[1];y++)for(let x=0;x<dims[0];x++){
 let sum=0;for(const off of [-.25,.25]){
  v.set(lo.x+(x+.5+off)/dims[0]*(hi.x-lo.x+1),lo.y+(1-(z+.5+off)/dims[2])*(hi.y-lo.y+1),lo.z+(y+.5+off)/dims[1]*(hi.z-lo.z+1));
  const d=grid.getValue(v);if(!Number.isFinite(d)||d<0)throw Error('invalid density '+d);sum+=d;
 }
 const d=sum/2;data[x+dims[0]*(y+dims[1]*z)]=d;max=Math.max(max,d);min=Math.min(min,d);if(d>0)positive++;
}if(z%32===0)console.log('density slice',z);}
const out=path.join(root,'verification/a-vdb-live-20261007/rejected-js-mask');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'density.f32'),Buffer.from(data.buffer));
const manifest={source:path.relative(root,file),sourceSHA256:crypto.createHash('sha256').update(raw).digest('hex'),converter:'openvdb npm0.3.0 creator JS + three0.186.1',grid:'density',indexBounds:[lo.toArray(),hi.toArray()],worldBounds:grid.getPreciseWorldBbox().map(v=>v.toArray()),dims,min,max,positive,axis:'x=sourceX y=sourceZ z=-sourceY; x fastest',extentKm:[18,18*(hi.z-lo.z+1)/(hi.x-lo.x+1),18*(hi.y-lo.y+1)/(hi.x-lo.x+1)],sample:'two diagonal index samples per texel',densitySHA256:crypto.createHash('sha256').update(Buffer.from(data.buffer)).digest('hex')};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest));
