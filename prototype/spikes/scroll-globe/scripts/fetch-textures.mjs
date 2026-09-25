// Downloads spike-only Earth textures from the three.js examples repository.
// Their upstream licence/provenance is NOT documented there, so they are
// gitignored and must not ship in the ECG product. See the pipeline audit doc.
import {writeFile,mkdir} from 'node:fs/promises';
const base='https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/';
const files=['earth_atmos_2048.jpg','earth_lights_2048.png','earth_normal_2048.jpg','earth_specular_2048.jpg'];
await mkdir(new URL('../public/textures/',import.meta.url),{recursive:true});
for(const f of files){const r=await fetch(base+f);if(!r.ok)throw Error(f+' '+r.status);const b=Buffer.from(await r.arrayBuffer());await writeFile(new URL('../public/textures/'+f,import.meta.url),b);console.log(f,b.length);}
