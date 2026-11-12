// Roughness (median |2nd difference| over the last 2 s) per series straight from the bridge stream. node rough.cjs <bridgeBase> [seconds]
const http=require('node:http');const [B,SEC]=[process.argv[2]||'http://127.0.0.1:8765',Number(process.argv[3]||4)];const u=new URL(B);const S={};
const r=http.get({host:u.hostname,port:u.port,path:'/stream'},x=>{let buf='';x.setEncoding('utf8');x.on('data',c=>{buf+=c;let i;while((i=buf.indexOf('\n\n'))>=0){const ev=buf.slice(0,i);buf=buf.slice(i+2);const m=ev.match(/^data: (.*)$/m);if(!m)continue;let d;try{d=JSON.parse(m[1]);if(typeof d==='string')d=JSON.parse(d);}catch{continue;}
 if(!d.raw)continue;(S.raw??=[]).push(...d.raw);for(const [k,v] of Object.entries(d.out||{}))(S[k]??=[]).push(...v);}});});
setTimeout(()=>{r.destroy();const R={};for(const [k,a] of Object.entries(S)){const b=a.slice(-500),v=[];for(let t=2;t<b.length;t++)v.push(Math.abs(b[t]-2*b[t-1]+b[t-2]));v.sort((p,q)=>p-q);R[k]=v[v.length>>1];}
 const raw=R.raw;console.log(Object.entries(R).map(([k,x])=>`${k} ${x.toExponential(2)} (×raw ${(x/raw).toFixed(3)})`).join(' · '));},SEC*1000);
