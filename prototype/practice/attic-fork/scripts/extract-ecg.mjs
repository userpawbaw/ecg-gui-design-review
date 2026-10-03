// Extract the stored scene d0-awgn-0 (D0 S038, white noise 0 dB; D-042) for the practice build.
// Reads prototype/v2/public/archive.json (project data, gitignored there) → public/ecg-s038.json (small).
// R peaks use the same detector as prototype/v2/src/story/intro/beats.ts (detectR). Values are stored values, not demo values.
import {readFileSync,writeFileSync} from 'node:fs';
const a=JSON.parse(readFileSync(new URL('../../../v2/public/archive.json',import.meta.url),'utf8'));
const s=a.scenes.find(x=>x.id==='d0-awgn-0');if(!s)throw Error('scene d0-awgn-0 missing');
const dec=e=>{const b=Buffer.from(e,'base64');const o=new Float32Array(a.n);for(let i=0;i<a.n;i++)o[i]=b.readInt16LE(i*2)*s.scale;return o;};
function detectR(x,fs){
 const n=x.length,med=Float32Array.from(x).sort()[n>>1],e=new Float32Array(n),w=Math.max(1,Math.round(.04*fs));
 for(let i=1;i<n-1;i++)e[i]=Math.abs(x[i+1]-x[i-1]);
 const sm=new Float32Array(n);let acc=0;for(let i=0;i<n;i++){acc+=e[i];if(i>=w)acc-=e[i-w];sm[i]=acc/w;}
 let max=0;for(const v of sm)max=Math.max(max,v);const thr=.35*max,refr=Math.round(.25*fs),out=[];
 for(let i=0;i<n;){if(sm[i]<thr){i++;continue;}let j=i;while(j<n&&sm[j]>=thr*.5)j++;let best=i,bv=-1;
  for(let k=Math.max(0,i-w);k<Math.min(n,j+w);k++){const d=Math.abs(x[k]-med);if(d>bv){bv=d;best=k;}}
  if(!out.length||best-out[out.length-1]>=refr)out.push(best);i=Math.max(j,best+refr);}
 return out;
}
const clean=dec(s.traces.clean),input=dec(s.traces.input),out=dec(s.traces.M06);
const r=detectR(clean,a.fs),r4=x=>Array.from(x,v=>+v.toFixed(4));
writeFileSync(new URL('../public/ecg-s038.json',import.meta.url),JSON.stringify({scene:s.id,record:s.record,cond:s.cond,snr:s.snr,fs:a.fs,n:a.n,method:'M06',clean:r4(clean),input:r4(input),out:r4(out),r}));
console.log('R peaks',r.length,r.slice(0,8),'bpm≈',(60*a.fs/((r[r.length-1]-r[0])/(r.length-1))).toFixed(1));
