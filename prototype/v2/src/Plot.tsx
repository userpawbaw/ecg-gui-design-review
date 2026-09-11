import {useEffect,useRef} from 'react';
import {Transport,visiblePoints,type Mode} from './engine';
import type {Loaded} from './data';
type Props={data:Loaded;transport:Transport;mode:Mode;span:number;inspect:boolean;amplitude:number;reference:number;method:string;preview:string|null;comparison:string|null;large?:boolean;soft:boolean;residual?:boolean};
export function Plot(p:Props){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(p);latest.current=p;
 useEffect(()=>{const c=canvas.current!;const g=c.getContext('2d');if(!g)return;let raf=0,signature='';
 const draw=()=>{const q=latest.current,t=q.transport.time;const rect=c.getBoundingClientRect(),dpr=devicePixelRatio||1;
 const sig=[t,q.mode,q.span,q.inspect,q.amplitude,q.reference,q.method,q.preview,q.comparison,q.data.scene.id,q.soft,q.residual,rect.width,rect.height,dpr].join('|');
 if(sig!==signature){signature=sig;c.width=Math.round(rect.width*dpr);c.height=Math.round(rect.height*dpr);g.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;
 g.fillStyle='#112b39';g.fillRect(0,0,w,h);
 const rows=[{id:'input',label:'입력 · Noisy',color:'#ffbc79'},{id:q.method,label:q.method+' · '+(q.residual?'제거 성분 (입력 − 출력)':'선택 출력'),color:'#67e7c3'}];if(q.comparison&&q.comparison!==q.method)rows.push({id:q.comparison,label:q.comparison+' · 고정 비교',color:'#97c2ff'});
 const rh=h/rows.length,left=64,right=w-18,pw=right-left;const pts=visiblePoints(t,q.span,q.data.fs,q.data.n,q.mode,q.inspect,q.soft);
 rows.forEach((row,r)=>{const top=r*rh+36,bottom=(r+1)*rh-30,ph=bottom-top;
 g.font='600 14px system-ui';g.fillStyle=row.color;g.fillText(row.label,18,r*rh+22);g.font='11px system-ui';g.fillStyle='#acc2cd';g.fillText('±'+q.amplitude+' mV',left+150,r*rh+22);
 g.strokeStyle='#304955';g.lineWidth=.6;for(let k=0;k<=10;k++){g.beginPath();g.moveTo(left+k*pw/10,top);g.lineTo(left+k*pw/10,bottom);g.stroke();}for(let k=0;k<=4;k++){g.beginPath();g.moveTo(left,top+k*ph/4);g.lineTo(right,top+k*ph/4);g.stroke();}
 g.save();g.beginPath();g.rect(left,top,pw,ph);g.clip();
 const trace=(a:Float32Array|undefined,color:string,width:number,opacity:number,dash=false,residual=false)=>{if(!a)return;g.strokeStyle=color;g.lineWidth=width;g.setLineDash(dash?[5,4]:[]);let prev:typeof pts[number]|null=null,alpha=-1;
 const y=(i:number)=>top+ph/2-(residual?q.data.traces.input[i]-a[i]:a[i])/q.amplitude*ph/2;
 g.beginPath();for(const point of pts){if(prev&&!point.breakBefore&&point.alpha>0&&prev.alpha>0){const nextAlpha=opacity*Math.min(point.alpha,prev.alpha);if(nextAlpha!==alpha){g.stroke();g.beginPath();alpha=nextAlpha;g.globalAlpha=alpha;g.moveTo(left+prev.x*pw,y(prev.index));}g.lineTo(left+point.x*pw,y(point.index));}else{g.stroke();g.beginPath();alpha=-1;g.moveTo(left+point.x*pw,y(point.index));}prev=point;}g.stroke();
 g.globalAlpha=1;g.setLineDash([]);};
 if(!(q.residual&&r===1))trace(q.data.traces.clean,'#c4c6c7',2.4,q.reference);
 trace(q.data.traces[row.id],row.color,1.6,1,false,q.residual&&r===1);
 if(r===1&&q.preview&&q.preview!==q.method&&q.preview!==q.comparison&&!q.residual)trace(q.data.traces[q.preview],'#f6d18d',1.5,1,true);
 g.restore();if(!q.data.traces[row.id]){g.fillStyle='#ffbc79';g.fillText('이 방법 출력 없음',left+10,top+30);}
 g.fillStyle='#adc3ce';g.font='12px system-ui';for(let k=0;k<=4;k++){const at=q.inspect?Math.max(0,t-q.span)+k*Math.min(t,q.span)/4:t-q.span+k*q.span/4;const label=q.mode==='sweep'&&!q.inspect?(k*q.span/4).toFixed(1)+'s 위치':at<0?'—':at.toFixed(1)+'s';g.fillText(label,left+k*pw/4-(k===4?55:0),bottom+20);}
 if(q.mode==='sweep'&&!q.inspect){const x=left+((Math.floor(t*q.data.fs)%Math.round(q.span*q.data.fs))/Math.round(q.span*q.data.fs))*pw;g.strokeStyle='#bfd8e0';g.lineWidth=1;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();}
 });c.dataset.time=t.toFixed(3);c.dataset.mode=q.inspect?'inspect':q.mode;
 }if(q.transport.playing)raf=requestAnimationFrame(draw);};draw();const resize=new ResizeObserver(()=>{cancelAnimationFrame(raf);signature='';draw();});resize.observe(c);return()=>{cancelAnimationFrame(raf);resize.disconnect();};
 },[p.data,p.transport.playing,p.mode,p.span,p.inspect,p.amplitude,p.reference,p.method,p.preview,p.comparison,p.large,p.soft,p.residual]);
 return <canvas ref={canvas} className={'ecg-canvas '+(p.large?'large':'')+(p.comparison&&p.comparison!==p.method?' three':'')} role="img" aria-label={`동일 시간·진폭의 입력 및 ${p.method} 출력과 회색 Reference${p.preview?' · 점선 '+p.preview:''}`}/>;
}
