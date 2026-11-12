// Pairwise "containment" between live traces from the bridge stream (user's proposal 2026-11-13): cover(A ⊇ B) = share of B's samples whose
// value lies inside A's local band [min, max of A over ±W samples] widened by a margin M (≈ 2 px of an overlay panel). Also each trace's
// mean local band height (thickness). node coverage.cjs <bridgeBase> [seconds] [W] [marginFrac]
const http=require('node:http');const [B,SEC,W,MF]=[process.argv[2]||'http://127.0.0.1:8765',Number(process.argv[3]||5),Number(process.argv[4]||2),Number(process.argv[5]||.004)];
const u=new URL(B),S={};
const r=http.get({host:u.hostname,port:u.port,path:'/stream'},x=>{let buf='';x.setEncoding('utf8');x.on('data',c=>{buf+=c;let i;while((i=buf.indexOf('\n\n'))>=0){const ev=buf.slice(0,i);buf=buf.slice(i+2);const m=ev.match(/^data: (.*)$/m);if(!m)continue;let d;try{d=JSON.parse(m[1]);if(typeof d==='string')d=JSON.parse(d);}catch{continue;}
 if(!d.raw)continue;(S.raw??=[]).push(...d.raw);for(const [k,v] of Object.entries(d.out||{}))(S[k]??=[]).push(...v);}});});
setTimeout(()=>{r.destroy();const n=Math.min(...Object.values(S).map(a=>a.length)),N=Math.min(n,1250);const T={};
 for(const [k,a] of Object.entries(S)){const b=a.slice(a.length-N);const med=[...b].sort((p,q)=>p-q)[N>>1];T[k]=b.map(v=>v-med);}   // each trace centred like the shared overlay centre (outputs share one centre; raw separate)
 const all=Object.entries(T).filter(([k])=>k!=='raw').flatMap(([,v])=>v),sorted=[...all].sort((p,q)=>p-q),rng=sorted[Math.floor(all.length*.995)]-sorted[Math.floor(all.length*.005)],M=rng*MF;
 const band=a=>a.map((_,t)=>{let lo=Infinity,hi=-Infinity;for(let j=Math.max(0,t-W);j<=Math.min(a.length-1,t+W);j++){lo=Math.min(lo,a[j]);hi=Math.max(hi,a[j]);}return [lo-M,hi+M];});
 const names=Object.keys(T).filter(k=>k!=='raw'),bands=Object.fromEntries(names.map(k=>[k,band(T[k])]));
 console.log(`range ${rng.toExponential(2)} · margin ${M.toExponential(2)} (${(MF*100).toFixed(1)} % ≈ ${(MF*534).toFixed(1)} px) · W ±${W} samples · N ${N}`);
 console.log('thickness (mean local band, px of a 534 px panel):',names.map(k=>`${k} ${(bands[k].reduce((s,[lo,hi])=>s+hi-lo-2*M,0)/N/rng*534).toFixed(1)}`).join(' · '));
 console.log('cover[A ⊇ B]  (row A contains column B)');console.log('       '+names.map(k=>k.padStart(7)).join(''));
 for(const A of names)console.log(A.padEnd(7)+names.map(Bn=>{if(A===Bn)return '      -';const ins=T[Bn].filter((v,t)=>v>=bands[A][t][0]&&v<=bands[A][t][1]).length/N;return (ins*100).toFixed(0).padStart(6)+'%';}).join(''));
},SEC*1000);
