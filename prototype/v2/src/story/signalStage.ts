// Story signal stage — Canvas 2D, draws stored traces only (packet §1.1-3).
// Rows share one sample index → x mapping (same as Plot.tsx inspect: x = i / n).
// Input and output rows share one ±mV amplitude; the component strip (input − Reference) has its own
// fixed physical-mV scale with an explicit "display magnified" label (AP-01, F-026; precedent: v2.2.1 Difference gain).
export type SceneTraces={id:string,axis:string,record:string,cond:string,snr:number,fs:number,n:number,input:Float32Array,clean:Float32Array,out:Float32Array,method:string};
export type RowBox={top:number,bottom:number,left:number,right:number};
export type StageView={
 mode:'attract'|'story',
 prev:SceneTraces|null,cur:SceneTraces,mix:number,      // mix 0..1 — sequential fade: prev fades out (0–.5), cur fades in (.5–1)
 attractTime:number,reduced:boolean,
 amplitude:number,stripMv:number,
 rows:{strip:RowBox&{alpha:number},input:RowBox&{alpha:number},output:RowBox&{alpha:number},attract:RowBox&{alpha:number}},
 axisAlpha:number,labels:{strip:string,input:string,output:string},
 sweepApexY:number,                                     // px — the sweep light descends to the horizon apex
};
export const COLORS={input:'#ffbc79',output:'#67e7c3',reference:'#c4c6c7',ink:'#e6edf0',ink2:'#8aa0aa',line:'rgba(255,255,255,.14)'};

export function createSignalStage(canvas:HTMLCanvasElement){
 const g=canvas.getContext('2d')!;let w=0,h=0;
 const resize=()=>{const dpr=devicePixelRatio||1,r=canvas.getBoundingClientRect();w=r.width;h=r.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);g.setTransform(dpr,0,0,dpr,0,0);};
 const trace=(a:Float32Array,box:RowBox,amp:number,color:string,width:number,alpha:number,from=0,to=a.length,n=a.length)=>{
  if(alpha<=0||to<=from)return;const mid=(box.top+box.bottom)/2,half=(box.bottom-box.top)/2,pw=box.right-box.left;
  g.save();g.beginPath();g.rect(box.left,box.top-1,pw,box.bottom-box.top+2);g.clip();
  g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.beginPath();
  for(let i=from;i<to;i++){const x=box.left+i/n*pw,y=mid-a[i]/amp*half;if(i===from)g.moveTo(x,y);else g.lineTo(x,y);}
  g.stroke();g.restore();
 };
 const diff=(s:SceneTraces)=>{const d=new Float32Array(s.n);for(let i=0;i<s.n;i++)d[i]=s.input[i]-s.clean[i];return d;};
 const diffCache=new WeakMap<SceneTraces,Float32Array>();const noise=(s:SceneTraces)=>{let d=diffCache.get(s);if(!d){d=diff(s);diffCache.set(s,d);}return d;};
 const ticks=(box:RowBox,amp:number,alpha:number,labels:number[])=>{if(alpha<=0)return;const mid=(box.top+box.bottom)/2,half=(box.bottom-box.top)/2;g.save();g.globalAlpha=alpha;g.font='11px system-ui, sans-serif';g.textAlign='right';g.textBaseline='middle';
  for(const v of labels){const y=mid-v/amp*half;g.fillStyle=COLORS.ink2;g.fillText(v===0?'0':(v<0?'−':'')+String(Math.abs(v)),box.left-10,y);g.strokeStyle=COLORS.line;g.lineWidth=.6;g.beginPath();g.moveTo(box.left-4,y);g.lineTo(box.left,y);g.stroke();}
  g.restore();};
 const label=(text:string,box:RowBox,alpha:number,color=COLORS.ink2)=>{if(alpha<=0||!text)return;g.save();g.globalAlpha=alpha;g.font='500 14px system-ui, sans-serif';g.fillStyle=color;g.textBaseline='alphabetic';g.fillText(text,box.left,box.top-10);g.restore();};
 const timeAxis=(box:RowBox,y:number,alpha:number,n:number,fs:number)=>{if(alpha<=0)return;const secs=n/fs;g.save();g.globalAlpha=alpha;g.strokeStyle=COLORS.line;g.lineWidth=1;g.beginPath();g.moveTo(box.left,y);g.lineTo(box.right,y);g.stroke();g.font='12px system-ui, sans-serif';g.fillStyle=COLORS.ink2;g.textBaseline='top';
  for(let k=0;k<=secs;k++){const x=box.left+k*fs/n*(box.right-box.left);g.beginPath();g.moveTo(x,y);g.lineTo(x,y+6);g.stroke();g.textAlign=k===0?'left':k===secs?'right':'center';g.fillText(k===0||k===secs?`${k} s`:String(k),x,y+10);}
  g.restore();};
 const mvLabel=(box:RowBox,alpha:number)=>{if(alpha<=0)return;g.save();g.globalAlpha=alpha;g.font='12px system-ui, sans-serif';g.fillStyle=COLORS.ink2;g.textAlign='right';g.fillText('mV',box.left-10,box.top-10);g.restore();};

 function drawScene(v:StageView,s:SceneTraces,a:number){
  const r=v.rows;
  // component strip: input − Reference on its own magnified physical scale
  if(r.strip.alpha>0){trace(noise(s),r.strip,v.stripMv,COLORS.input,1,.85*a*r.strip.alpha);}
  trace(s.input,r.input,v.amplitude,COLORS.input,1.4,a*r.input.alpha);
  trace(s.clean,r.output,v.amplitude,COLORS.reference,2.2,.55*a*r.output.alpha);
  trace(s.out,r.output,v.amplitude,COLORS.output,1.5,a*r.output.alpha);
 }
 function drawAttract(v:StageView){
  const s=v.cur,box=v.rows.attract,al=box.alpha;if(al<=0)return;
  if(v.reduced){trace(s.input,box,v.amplitude,COLORS.input,1.4,.22*al);trace(s.clean,box,v.amplitude,COLORS.reference,2.2,.5*al);trace(s.out,box,v.amplitude,COLORS.output,1.6,al);return;}
  const head=Math.floor(v.attractTime*s.fs)%s.n,gap=Math.round(.12*s.fs);
  trace(s.clean,box,v.amplitude,COLORS.reference,2.2,.5*al,0,head+1);
  trace(s.out,box,v.amplitude,COLORS.output,1.6,al,0,head+1);
  trace(s.input,box,v.amplitude,COLORS.input,1.4,al,Math.min(s.n,head+gap),s.n);
  // sweep head: UI-02 leading glow (white ~30 % mix, 32 px) — position marker only, old trace never glows
  const x=box.left+head/s.n*(box.right-box.left);g.save();g.globalAlpha=al;
  const grad=g.createLinearGradient(x-16,0,x+16,0);grad.addColorStop(0,'rgba(238,241,246,0)');grad.addColorStop(.5,'rgba(238,241,246,.30)');grad.addColorStop(1,'rgba(238,241,246,0)');
  g.fillStyle=grad;g.fillRect(x-16,box.top-18,32,box.bottom-box.top+36);
  const beam=g.createLinearGradient(0,box.top-40,0,v.sweepApexY);beam.addColorStop(0,'rgba(238,241,246,.0)');beam.addColorStop(.15,'rgba(238,241,246,.85)');beam.addColorStop(1,'rgba(238,241,246,.35)');
  g.strokeStyle=beam;g.lineWidth=1.2;g.beginPath();g.moveTo(x,box.top-40);g.lineTo(x,v.sweepApexY);g.stroke();g.restore();
 }
 function draw(v:StageView){
  g.clearRect(0,0,w,h);
  if(v.mode==='attract'){drawAttract(v);const b=v.rows.attract;timeAxis(b,b.bottom+18,v.axisAlpha*b.alpha,v.cur.n,v.cur.fs);mvLabel(b,v.axisAlpha*b.alpha);return;}
  const m=v.reduced?1:v.mix;
  if(v.prev&&m<.5)drawScene(v,v.prev,1-2*m);if(m>=.5||!v.prev)drawScene(v,v.cur,v.prev?2*m-1:1);
  const r=v.rows,shown=v.prev&&m<.5?v.prev:v.cur;
  label(v.labels.strip,r.strip,r.strip.alpha);label(v.labels.input,r.input,r.input.alpha);label(v.labels.output,r.output,r.output.alpha,COLORS.output);
  ticks(r.strip,v.stripMv,r.strip.alpha*v.axisAlpha,[v.stripMv,0,-v.stripMv]);
  ticks(r.input,v.amplitude,r.input.alpha*v.axisAlpha,[.6,0,-.6]);ticks(r.output,v.amplitude,r.output.alpha*v.axisAlpha,[.6,0,-.6]);
  mvLabel(r.input,r.input.alpha*v.axisAlpha);
  timeAxis(r.output,r.output.bottom+16,r.output.alpha*v.axisAlpha,shown.n,shown.fs);
 }
 resize();
 return{draw,resize};
}
