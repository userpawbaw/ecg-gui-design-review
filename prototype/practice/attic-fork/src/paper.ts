// Paper faces shared by the hero book (first spread, seen in the original room) and the page world (same spread, our lighting),
// so the cross-fade between them lands on identical pages. Data contract: the trace is the STORED samples at their stored time.
import {type Ecg,idxAt} from './ecg';

export const PAGE_W=1.5,PAGE_H=2.0;                      // page size in scene units (aspect 3:4)
export const WIN=4;                                      // seconds across the page
export const FONT='"Pretendard","Malgun Gothic","Apple SD Gothic Neo",sans-serif',MONO='"IBM Plex Mono",ui-monospace,Consolas,monospace';

export function paperBase(g:CanvasRenderingContext2D,w:number,h:number){
 g.fillStyle='#f4ecda';g.fillRect(0,0,w,h);
 for(let i=0;i<9000;i++){g.fillStyle=`rgba(120,95,60,${Math.random()*.05})`;g.fillRect(Math.random()*w,Math.random()*h,1.6,1.6);}
}

/** left page: static */
export function drawLeftPage(g:CanvasRenderingContext2D){
 paperBase(g,1200,1600);
 g.fillStyle='#8a6f5a';g.font=`500 28px ${MONO}`;g.textBaseline='alphabetic';g.fillText('D0 · S038',70,110);
 g.fillStyle='#b09a82';g.font=`400 24px ${FONT}`;g.fillText('ARCHIVED REPLAY — 실제 장치 세션 없음',70,1540);
 const gr=g.createLinearGradient(1200,0,900,0);gr.addColorStop(0,'rgba(60,40,20,.28)');gr.addColorStop(1,'rgba(60,40,20,0)');g.fillStyle=gr;g.fillRect(900,0,300,1600);
}

/** right page: ECG paper + the stored trace, sweeping. mix 0 = noisy input, 1 = cleaned output (cross-fade, not a cover). */
export function drawEcgPaper(g:CanvasRenderingContext2D,ecg:Ecg,time:number,mix:number){
 const X0=60,X1=1140,Y0=330,Y1=1500,YB=915,PXS=(X1-X0)/WIN,PXMV=108;        // 0.2 s = 54 px · 0.5 mV = 54 px
 paperBase(g,1200,1600);
 g.save();g.beginPath();g.rect(X0,Y0,X1-X0,Y1-Y0);g.clip();
 for(let x=X0;x<=X1;x+=PXS*.04){g.strokeStyle='rgba(222,140,130,.5)';g.lineWidth=1;g.beginPath();g.moveTo(x,Y0);g.lineTo(x,Y1);g.stroke();}
 for(let y=YB%(PXMV*.1);y<=Y1;y+=PXMV*.1){if(y<Y0)continue;g.strokeStyle='rgba(222,140,130,.5)';g.lineWidth=1;g.beginPath();g.moveTo(X0,y);g.lineTo(X1,y);g.stroke();}
 for(let x=X0;x<=X1+1;x+=PXS*.2){g.strokeStyle='rgba(200,95,90,.78)';g.lineWidth=1.8;g.beginPath();g.moveTo(x,Y0);g.lineTo(x,Y1);g.stroke();}
 for(let y=YB%(PXMV*.5);y<=Y1;y+=PXMV*.5){if(y<Y0)continue;g.strokeStyle='rgba(200,95,90,.78)';g.lineWidth=1.8;g.beginPath();g.moveTo(X0,y);g.lineTo(X1,y);g.stroke();}
 g.strokeStyle='rgba(90,70,55,.35)';g.lineWidth=1.4;g.beginPath();g.moveTo(X0,YB);g.lineTo(X1,YB);g.stroke();
 // sweep: segment k, head at (time mod WIN); left of head = fresh data, right of head = previous segment, dim
 const seg=Math.floor(time/WIN),head=(time%WIN)/WIN*(X1-X0);
 const trace=(arr:Float32Array,segment:number,x0:number,x1:number,col:string,alpha:number,lw:number)=>{
  if(alpha<=.01||x1<=x0)return;g.strokeStyle=col;g.globalAlpha=alpha;g.lineWidth=lw;g.lineJoin='round';g.beginPath();let first=true;
  for(let x=x0;x<=x1;x+=1.5){const ix=idxAt(ecg,segment*WIN+x/PXS),i0=Math.floor(ix),f=ix-i0,v=arr[i0]*(1-f)+arr[Math.min(arr.length-1,i0+1)]*f;
   const y=YB-v*PXMV;if(first){g.moveTo(X0+x,y);first=false;}else g.lineTo(X0+x,y);}g.stroke();g.globalAlpha=1;};
 const inkIn='#7a5538',inkOut='#0d4a5a',aIn=1-.88*mix,aOut=.12+.88*mix;
 trace(ecg.input,seg-1,head+40,X1-X0,inkIn,.22*aIn,2.2);trace(ecg.out,seg-1,head+40,X1-X0,inkOut,.22*aOut,2.2);
 trace(ecg.input,seg,0,head,inkIn,.95*aIn,3.2);trace(ecg.out,seg,0,head,inkOut,.98*aOut,4.4);
 g.strokeStyle='rgba(13,74,90,.55)';g.lineWidth=2;g.beginPath();g.moveTo(X0+head,Y0);g.lineTo(X0+head,Y1);g.stroke();
 g.restore();
 // type: Korean title, mono meta, scale legend (D-044: text is designed, not placed)
 g.fillStyle='#4b3b2e';g.font=`700 40px ${FONT}`;g.fillText('저장된 기록 · 0 dB 백색 잡음',60,150);
 g.fillStyle='#8a6f5a';g.font=`500 26px ${MONO}`;g.fillText(`입력 → 출력 ${ecg.method} · 저장값 · ${ecg.fs} Hz`,60,198);
 g.fillStyle=`rgba(122,85,56,${.35+.65*aIn})`;g.font=`500 24px ${FONT}`;g.fillText('입력(잡음 섞임)',60,290);
 g.fillStyle=`rgba(13,74,90,${.35+.65*aOut})`;g.fillText('출력(잡음 제거)',330,290);
 g.fillStyle='#8a6f5a';g.font=`400 22px ${MONO}`;g.fillText('격자: 0.2 s · 0.5 mV',60,1556);
 const gr=g.createLinearGradient(0,0,300,0);gr.addColorStop(0,'rgba(60,40,20,.28)');gr.addColorStop(1,'rgba(60,40,20,0)');g.fillStyle=gr;g.fillRect(0,0,300,1600);
}
