// Paper faces shared by the hero book (first spread, seen in the original room) and the page world (same spread, our lighting),
// so the cross-fade between them lands on identical pages. Data contract: the trace is the STORED samples at their stored time.
import type {Ecg} from './ecg';

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
 const gr=g.createLinearGradient(1200,0,820,0);gr.addColorStop(0,'rgba(50,32,14,.5)');gr.addColorStop(.35,'rgba(50,32,14,.16)');gr.addColorStop(1,'rgba(60,40,20,0)');g.fillStyle=gr;g.fillRect(820,0,380,1600);
}

export const PLOT={X0:60,X1:1140,Y0:330,Y1:1500,YB:915,PXMV:108};   // canvas px; 0.2 s = 54 px, 0.5 mV = 54 px

/** right page: ECG paper, labels and scale legend — STATIC (drawn once). The stored trace itself is drawn on the GPU (trace.ts). */
export function drawEcgPaperStatic(g:CanvasRenderingContext2D,ecg:Ecg){
 const {X0,X1,Y0,Y1,YB,PXMV}=PLOT,PXS=(X1-X0)/WIN;
 paperBase(g,1200,1600);
 g.save();g.beginPath();g.rect(X0,Y0,X1-X0,Y1-Y0);g.clip();
 for(let x=X0;x<=X1;x+=PXS*.04){g.strokeStyle='rgba(222,140,130,.5)';g.lineWidth=1;g.beginPath();g.moveTo(x,Y0);g.lineTo(x,Y1);g.stroke();}
 for(let y=YB%(PXMV*.1);y<=Y1;y+=PXMV*.1){if(y<Y0)continue;g.strokeStyle='rgba(222,140,130,.5)';g.lineWidth=1;g.beginPath();g.moveTo(X0,y);g.lineTo(X1,y);g.stroke();}
 for(let x=X0;x<=X1+1;x+=PXS*.2){g.strokeStyle='rgba(200,95,90,.78)';g.lineWidth=1.8;g.beginPath();g.moveTo(x,Y0);g.lineTo(x,Y1);g.stroke();}
 for(let y=YB%(PXMV*.5);y<=Y1;y+=PXMV*.5){if(y<Y0)continue;g.strokeStyle='rgba(200,95,90,.78)';g.lineWidth=1.8;g.beginPath();g.moveTo(X0,y);g.lineTo(X1,y);g.stroke();}
 g.strokeStyle='rgba(90,70,55,.35)';g.lineWidth=1.4;g.beginPath();g.moveTo(X0,YB);g.lineTo(X1,YB);g.stroke();
 g.restore();
 // type: Korean title, mono meta, scale legend (D-044: text is designed, not placed)
 g.fillStyle='#4b3b2e';g.font=`700 40px ${FONT}`;g.fillText('저장된 기록 · 0 dB 백색 잡음',60,150);
 g.fillStyle='#8a6f5a';g.font=`500 26px ${MONO}`;g.fillText(`입력 → 출력 ${ecg.method} · 저장값 · ${ecg.fs} Hz`,60,198);
 g.fillStyle='rgba(122,85,56,.95)';g.font=`500 24px ${FONT}`;g.fillText('입력(잡음 섞임)',60,290);
 g.fillStyle='rgba(13,74,90,.95)';g.fillText('출력(잡음 제거)',330,290);
 g.fillStyle='#8a6f5a';g.font=`400 22px ${MONO}`;g.fillText('격자: 0.2 s · 0.5 mV',60,1556);
 const gr=g.createLinearGradient(0,0,300,0);gr.addColorStop(0,'rgba(60,40,20,.28)');gr.addColorStop(1,'rgba(60,40,20,0)');g.fillStyle=gr;g.fillRect(0,0,300,1600);
}

/** Plate layout on the 1200×1600 canvas: a dark glossy ECG plate (the earlier intro's dark grid) set into cream paper. */
export const PLATE={x:44,y:292,w:1112,h:1250,r:26};
/** right page v2: cream paper + dark ECG plate. Returns colour + roughness canvases (plate = glossy coat, paper = matte). */
export function drawEcgPlate(gc:CanvasRenderingContext2D,gr:CanvasRenderingContext2D,ecg:Ecg){
 const {X0,X1,Y0,Y1,YB,PXMV}=PLOT,PXS=(X1-X0)/WIN,P=PLATE;
 paperBase(gc,1200,1600);
 gr.fillStyle='#e6e6e6';gr.fillRect(0,0,1200,1600);                       // paper roughness ≈ .9
 const rr=(g:CanvasRenderingContext2D)=>{g.beginPath();g.roundRect(P.x,P.y,P.w,P.h,P.r);};
 rr(gc);const bg=gc.createLinearGradient(0,P.y,0,P.y+P.h);bg.addColorStop(0,'#0c1319');bg.addColorStop(1,'#091016');gc.fillStyle=bg;gc.fill();
 rr(gr);gr.fillStyle='#4a4a4a';gr.fill();                                   // plate roughness ≈ .3 (glossy coat)
 gc.save();rr(gc);gc.clip();
 for(let x=X0;x<=X1+1;x+=PXS*.04){gc.strokeStyle='rgba(120,170,180,.07)';gc.lineWidth=1;gc.beginPath();gc.moveTo(x,P.y);gc.lineTo(x,P.y+P.h);gc.stroke();}
 for(let y=YB%(PXMV*.1);y<=P.y+P.h;y+=PXMV*.1){if(y<P.y)continue;gc.strokeStyle='rgba(120,170,180,.07)';gc.beginPath();gc.moveTo(P.x,y);gc.lineTo(P.x+P.w,y);gc.stroke();}
 for(let x=X0;x<=X1+1;x+=PXS*.2){gc.strokeStyle='rgba(130,185,195,.17)';gc.lineWidth=1.6;gc.beginPath();gc.moveTo(x,P.y);gc.lineTo(x,P.y+P.h);gc.stroke();}
 for(let y=YB%(PXMV*.5);y<=P.y+P.h;y+=PXMV*.5){if(y<P.y)continue;gc.strokeStyle='rgba(130,185,195,.17)';gc.lineWidth=1.6;gc.beginPath();gc.moveTo(P.x,y);gc.lineTo(P.x+P.w,y);gc.stroke();}
 gc.strokeStyle='rgba(180,220,225,.22)';gc.lineWidth=1.8;gc.beginPath();gc.moveTo(X0,YB);gc.lineTo(X1,YB);gc.stroke();
 gc.restore();
 gc.fillStyle='#4b3b2e';gc.font=`700 40px ${FONT}`;gc.fillText('저장된 기록 · 0 dB 백색 잡음',60,150);
 gc.fillStyle='#8a6f5a';gc.font=`500 26px ${MONO}`;gc.fillText(`입력 → 출력 ${ecg.method} · 저장값 · ${ecg.fs} Hz`,60,198);
 gc.fillStyle='#ffbc79';gc.font=`500 24px ${FONT}`;gc.fillText('입력(잡음 섞임)',P.x+28,P.y+50);
 gc.fillStyle='#67e7c3';gc.fillText('출력(잡음 제거)',P.x+300,P.y+50);
 gc.fillStyle='rgba(180,215,220,.55)';gc.font=`400 22px ${MONO}`;gc.fillText('격자 0.2 s · 0.5 mV',P.x+28,P.y+P.h-24);
 const gg=gc.createLinearGradient(0,0,330,0);gg.addColorStop(0,'rgba(50,32,14,.5)');gg.addColorStop(.35,'rgba(50,32,14,.16)');gg.addColorStop(1,'rgba(60,40,20,0)');gc.fillStyle=gg;gc.fillRect(0,0,330,1600);
}
