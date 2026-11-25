// D-194 측정: 특징별 초점 폭이 표시 구간에서 차지하는 비율 + 구간 규칙 후보. 실행: cd prototype/v2 → npx tsx ../../verification/disease-zoom-20261125/focus_fraction.ts
import {readFileSync} from 'node:fs';
import {decode} from '/home/user/ecg-gui-design-review/prototype/v2/src/engine.ts';
import {buildNormalRow,buildTour,ROW_CFG,needsRef} from '/home/user/ecg-gui-design-review/prototype/v2/src/disease/tour.ts';
const L=(id:string)=>{const d=JSON.parse(readFileSync(`/home/user/ecg-gui-design-review/data/disease/${id}.json`,'utf8'));return {d,x:decode(d.scenes[0].traces.clean,d.scenes[0].scale,d.n)};};
const r=L('normal');const ref={x:r.x,beats:r.d.beats};
for(const id of Object.keys(ROW_CFG)){const {d,x}=L(id),row=buildNormalRow(x,d.beats,d.fs,ROW_CFG[id],needsRef(id)?ref:undefined)!,t=buildTour(id,x,d.beats,d.fs,row,5,d.rhythm)!;const sp=t.span!;
 for(const s of t.steps){const a=Math.min(...s.regions.map(g=>g.t0),...s.calipers.map(c=>Math.min(c.t0,c.t1))),b=Math.max(...s.regions.map(g=>g.t1),...s.calipers.map(c=>Math.max(c.t0,c.t1)));
  const W=b-a, vis=Math.max(...s.regions.map(g=>(g.t1-g.t0)*1.32+.08));   // 보이는 초점(타원) 폭 ≈ 구간 × 1.32 + 10 px
  console.log(id.padEnd(9),s.id.padEnd(8),s.title.padEnd(14),'span',sp,'focus',W.toFixed(2)+'s',(100*W/sp).toFixed(0).padStart(3)+'%','spot',(100*vis/sp).toFixed(0).padStart(3)+'%');}}
console.log('\n--- 제안 규칙: 5 s에서 시작, 보이는 초점(타원)이 30 % 이상이 되는 가장 넓은 구간 ∈ {5, 2.5, 1.25}; 최소 max(1.25, 1.5 × R–R); 내용이 5 s의 80 %를 넘으면 10 s');
for(const id of Object.keys(ROW_CFG)){const {d,x}=L(id),row=buildNormalRow(x,d.beats,d.fs,ROW_CFG[id],needsRef(id)?ref:undefined)!,t=buildTour(id,x,d.beats,d.fs,row,5,d.rhythm)!;
 const out:string[]=[];let prev=5;for(const s of t.steps){const a=Math.min(...s.regions.map(g=>g.t0),...s.calipers.map(c=>Math.min(c.t0,c.t1))),b=Math.max(...s.regions.map(g=>g.t1),...s.calipers.map(c=>Math.max(c.t0,c.t1)));
  const W=b-a,vis=Math.max(...s.regions.map(g=>(g.t1-g.t0)*1.32+.08)),minS=Math.max(1.25,1.5*row.rr);let sp=5;
  if(W>.8*5)sp=10;else for(const c of [5,2.5,1.25]){if(c<minS-1e-6)break;sp=c;if(vis/c>=.3)break;}
  out.push(`${s.title} ${sp}s(${(100*vis/sp).toFixed(0)}%)${sp!==prev?' ←'+(sp<prev?'확대':'축소'):''}`);prev=sp;}
 console.log(id.padEnd(9),'RR',row.rr.toFixed(2),'|',out.join(' → '));}
console.log('\n--- 연속 규칙: 구간 = 초점 ÷ 0.35, 0.25 s 단위, [max(1.25, 1.5 × R–R), 5]; 내용 > 5 s의 80 % → 10 s');
for(const id of Object.keys(ROW_CFG)){const {d,x}=L(id),row=buildNormalRow(x,d.beats,d.fs,ROW_CFG[id],needsRef(id)?ref:undefined)!,t=buildTour(id,x,d.beats,d.fs,row,5,d.rhythm)!;
 const out:string[]=[];for(const s of t.steps){const a=Math.min(...s.regions.map(g=>g.t0),...s.calipers.map(c=>Math.min(c.t0,c.t1))),b=Math.max(...s.regions.map(g=>g.t1),...s.calipers.map(c=>Math.max(c.t0,c.t1)));
  const W=b-a,vis=Math.max(...s.regions.map(g=>(g.t1-g.t0)*1.32+.08)),minS=Math.max(1.25,1.5*row.rr);
  const sp=W>.8*5?10:Math.min(5,Math.max(Math.ceil(minS*4)/4,Math.round(vis/.35*4)/4));out.push(`${s.title} ${sp}s(${(100*vis/sp).toFixed(0)}%)`);}
 console.log(id.padEnd(9),'|',out.join(' → '));}
