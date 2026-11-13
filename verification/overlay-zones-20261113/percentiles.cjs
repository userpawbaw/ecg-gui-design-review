// Per-series deviation from the outputs' common baseline (median of all outputs), up and down, at several percentiles, over the last N s of the bridge stream.
// node percentiles.cjs <bridgeBase> [seconds]
const http=require('node:http');const [B,SEC]=[process.argv[2]||'http://127.0.0.1:8765',Number(process.argv[3]||6)];const u=new URL(B),S={};
const r=http.get({host:u.hostname,port:u.port,path:'/stream'},x=>{let buf='';x.setEncoding('utf8');x.on('data',c=>{buf+=c;let i;while((i=buf.indexOf('\n\n'))>=0){const ev=buf.slice(0,i);buf=buf.slice(i+2);const m=ev.match(/^data: (.*)$/m);if(!m)continue;let d;try{d=JSON.parse(m[1]);if(typeof d==='string')d=JSON.parse(d);}catch{continue;}
 if(!d.raw)continue;(S.raw??=[]).push(...d.raw);for(const [k,v] of Object.entries(d.out||{}))(S[k]??=[]).push(...v);}});});
setTimeout(()=>{r.destroy();const n=Math.min(...Object.values(S).map(a=>a.length)),N=Math.min(n,2500);const T={};for(const [k,a] of Object.entries(S))T[k]=a.slice(a.length-N);
 const med=a=>[...a].sort((p,q)=>p-q)[a.length>>1];const outs=Object.keys(T).filter(k=>k!=='raw');const c=med(outs.flatMap(k=>T[k]));const cr=med(T.raw);
 const Q=[.5,.75,.9,.95,.98,.995];console.log('N',N,'q:',Q.join(' '));
 for(const [k,a] of Object.entries(T)){const cc=k==='raw'?cr:c;const up=a.map(v=>v-cc).sort((p,q)=>p-q),dn=a.map(v=>cc-v).sort((p,q)=>p-q);const at=(s,q)=>Math.max(0,s[Math.floor(q*(s.length-1))]);
  console.log(k.padEnd(5),'up',Q.map(q=>at(up,q).toFixed(3)).join(' '),' | down',Q.map(q=>at(dn,q).toFixed(3)).join(' '));}
 const DIL=Number(process.argv[4]||20),cons=Array.from({length:N},(_,t)=>med(outs.map(k=>T[k][t]-c))),ab=cons.map(Math.abs),lim=.35*[...ab].sort((p,q)=>p-q)[Math.floor(.995*(N-1))];
 const qrs=new Uint8Array(N);ab.forEach((v,t)=>{if(v>lim)for(let j=Math.max(0,t-DIL);j<=Math.min(N-1,t+DIL);j++)qrs[j]=1;});const keep=[...qrs].filter(x=>!x).length;
 console.log(`QRS excluded (consensus > ${lim.toFixed(3)}, ±${DIL}): kept ${keep}/${N} → 99.5 %:`);
 for(const [k,a] of Object.entries(T)){const cc=k==='raw'?cr:c;const v=a.filter((_,t)=>!qrs[t]);const up=v.map(x=>x-cc).sort((p,q)=>p-q),dn=v.map(x=>cc-x).sort((p,q)=>p-q);const at=s=>Math.max(0,s[Math.floor(.995*(s.length-1))]);
  console.log(' ',k.padEnd(5),'up',at(up).toFixed(3),'down',at(dn).toFixed(3));}},SEC*1000);
// variant: exclude QRS — samples where the outputs' consensus (median across outputs) deviates > 35 % of its own 99.5 % value, dilated ±DIL samples
setTimeout(()=>{},0);
