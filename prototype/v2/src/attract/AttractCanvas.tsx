import {useEffect,useRef,useState} from 'react';
import type {Transport} from '../engine';
import {geometry,sampleAt,sampleX,valueY,type SignalView,type SignalGeometry} from './signal';

type Props={view:SignalView;transport:Transport;variant:'a'|'b';boundary:number;reference:boolean;amplitudeMv:number;spanSeconds:number;reducedMotion:boolean};
function pathFor(view:SignalView,g:SignalGeometry,kind:'input'|'output'|'reference'){
 const path=new Path2D();let first=true;
 for(let i=g.startIndex;i<=g.endIndex;i++){
  const s=sampleAt(view,i);if(!s)continue;
  const x=sampleX(g,i,view.fs),y=valueY(g,s[kind]);
  if(first){path.moveTo(x,y);first=false;}else path.lineTo(x,y);
 }
 return path;
}
function stroke(g:CanvasRenderingContext2D,path:Path2D,color:string,width:number,alpha=1){g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke(path);g.globalAlpha=1;}
export function AttractCanvas(p:Props){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(p),pointer=useRef<{x:number;y:number}|null>(null),[readout,setReadout]=useState(''),[pointerTick,setPointerTick]=useState(0);latest.current=p;
 useEffect(()=>{const c=canvas.current!,ctx=c.getContext('2d');if(!ctx)return;let raf=0,old='',frames=0,last=0;
  const draw=(now:number)=>{const q=latest.current,r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),t=q.transport.time;
   const sig=[r.width,r.height,dpr,t,q.boundary,q.reference,q.amplitudeMv,q.spanSeconds,q.view.sceneId,q.view.offset,q.view.methodId,pointer.current?.x,pointer.current?.y].join('|');
   if(sig!==old){old=sig;const w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}ctx.setTransform(dpr,0,0,dpr,0,0);
    const g=geometry(q.view,t,r,q.amplitudeMv,q.spanSeconds);
    ctx.clearRect(0,0,r.width,r.height);
    ctx.fillStyle=q.variant==='a'?'rgba(5,17,23,.92)':'rgba(7,15,23,.43)';ctx.fillRect(0,0,r.width,r.height);
    ctx.lineWidth=.6;ctx.strokeStyle=q.variant==='a'?'rgba(111,198,215,.085)':'rgba(127,153,186,.12)';
    for(let x=g.left;x<=g.left+g.width;x+=g.width/20){ctx.beginPath();ctx.moveTo(x,g.top);ctx.lineTo(x,g.top+g.height);ctx.stroke();}
    for(let y=g.top;y<=g.top+g.height;y+=g.height/8){ctx.beginPath();ctx.moveTo(g.left,y);ctx.lineTo(g.left+g.width,y);ctx.stroke();}
    const output=pathFor(q.view,g,'output'),input=pathFor(q.view,g,'input'),reference=pathFor(q.view,g,'reference');
    ctx.save();ctx.beginPath();ctx.rect(g.left,g.top,g.width,g.height);ctx.clip();
    if(q.variant==='b'){
     const edge=g.left+g.width*q.boundary;
     if(q.reference)stroke(ctx,reference,'#b9c4d7',1,.25);
     ctx.save();ctx.beginPath();ctx.rect(g.left,g.top,edge-g.left,g.height);ctx.clip();
     stroke(ctx,input,'#7d64fe',12,.065);stroke(ctx,input,'#8d72ff',5,.22);stroke(ctx,input,'#ae9bff',1.8,.95);ctx.restore();
     ctx.save();ctx.beginPath();ctx.rect(edge,g.top,g.left+g.width-edge,g.height);ctx.clip();
     stroke(ctx,output,'#58eccd',10,.08);stroke(ctx,output,'#67ffe1',4,.18);stroke(ctx,output,'#a0ffe8',1.8,.98);ctx.restore();
     const grad=ctx.createLinearGradient(edge-16,0,edge+16,0);grad.addColorStop(0,'rgba(139,103,255,0)');grad.addColorStop(.5,'rgba(147,255,238,.24)');grad.addColorStop(1,'rgba(96,255,218,0)');ctx.fillStyle=grad;ctx.fillRect(edge-16,g.top,32,g.height);
     ctx.strokeStyle='#a3fff0';ctx.lineWidth=1;ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(edge,g.top);ctx.lineTo(edge,g.top+g.height);ctx.stroke();ctx.globalAlpha=1;
    }else{
     if(q.reference)stroke(ctx,reference,'#9eb8d4',1,.18);
     stroke(ctx,input,'#8da5cb',1.15,.13);
     // Every glow pass uses this same Path2D. Pointer and particles only change light, never coordinates.
     stroke(ctx,output,'#0bf5f1',10,.075);stroke(ctx,output,'#26fff7',4,.21);stroke(ctx,output,'#8afffa',1.8,1);
     if(!q.reducedMotion){
      const pointerLocal=pointer.current;
      if(pointerLocal){ctx.save();ctx.beginPath();ctx.arc(pointerLocal.x,pointerLocal.y,116,0,Math.PI*2);ctx.clip();stroke(ctx,output,'#befffe',5,.23);ctx.restore();}
      // Deterministic, capped particles. Their alpha and location derive from sampled input/output divergence.
      for(let i=g.startIndex;i<=g.endIndex;i+=Math.max(5,Math.ceil((g.endIndex-g.startIndex)/110))){
       const s=sampleAt(q.view,i);if(!s)continue;const difference=Math.abs(s.input-s.output);
       if(difference<.025)continue;
       const x=sampleX(g,i,q.view.fs),y=valueY(g,s.output);
       for(let k=0;k<3;k++){const jitter=Math.sin(i*12.9898+k*78.233)*43758.5453,phase=jitter-Math.floor(jitter);
        const spread=Math.min(55,difference*45),offset=(phase-.5)*spread;
        ctx.fillStyle=`rgba(81,241,255,${Math.min(.5,.12+difference*.45)})`;
        ctx.beginPath();ctx.arc(x+(k-1)*4,y+offset,phase>.8?1.5:.85,0,Math.PI*2);ctx.fill();}
      }
     }
    }ctx.restore();
    ctx.fillStyle='#b5c6ce';ctx.font='12px system-ui';ctx.fillText('[mV]',6,22);
    ctx.fillText(`±${q.amplitudeMv.toFixed(1)} mV`,g.left+2,r.height-46);
    ctx.fillText(`${g.windowStart.toFixed(1)} s`,g.left,r.height-22);
    ctx.textAlign='right';ctx.fillText(`${(g.windowStart+g.spanSeconds).toFixed(1)} s`,g.left+g.width,r.height-22);ctx.textAlign='left';
    c.dataset.time=t.toFixed(3);c.dataset.scene=q.view.sceneId;c.dataset.method=q.view.methodId;c.dataset.boundary=q.boundary.toFixed(3);
   }
   if(now-last>1000){c.dataset.fps=String(frames);frames=0;last=now;}frames++;
   if(q.transport.playing)raf=requestAnimationFrame(draw);
  };draw(performance.now());const observer=new ResizeObserver(()=>{old='';cancelAnimationFrame(raf);draw(performance.now());});observer.observe(c);return()=>{observer.disconnect();cancelAnimationFrame(raf);};
 },[p.view,p.transport.playing,p.variant,p.reducedMotion,p.boundary,p.reference,p.amplitudeMv,p.spanSeconds,pointerTick]);
 const onMove=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();pointer.current={x:e.clientX-r.left,y:e.clientY-r.top};if(!p.transport.playing&&!p.reducedMotion)setPointerTick(x=>x+1);if(p.variant==='b'){
  const g=geometry(p.view,p.transport.time,r,p.amplitudeMv,p.spanSeconds);const i=Math.round((g.windowStart+(pointer.current.x-g.left)/g.width*g.spanSeconds)*p.view.fs);const s=sampleAt(p.view,i);setReadout(s?`${s.timeSeconds.toFixed(2)} s · 입력 ${s.input.toFixed(3)} mV / 출력 ${s.output.toFixed(3)} mV`:'');
 }};
 return <div className="attract-plot"><canvas ref={canvas} onPointerMove={onMove} onPointerLeave={()=>{pointer.current=null;setReadout('');if(!p.transport.playing)setPointerTick(x=>x+1);}} role="img" aria-label={`같은 절대 sample index와 mV 눈금의 실제 입력, ${p.view.methodId} 출력${p.variant==='b'?' 비교 렌즈':''}`}/>{p.variant==='b'&&readout&&<div className="attract-readout" role="status">{readout}</div>}</div>;
}
