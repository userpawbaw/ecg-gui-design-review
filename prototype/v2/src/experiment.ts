import './experiment.css';
import methodData from './methods.json';

type Variant='A'|'B'|'C'|'D'|'E'|'F';
type EvidenceRow={metric:string;label:string;dir:string;method:string;n:number;mean:number;std?:number;median?:number};
type EvidencePayload={sourcePath?:string;experiment?:string;axis?:string;scope?:string;rows?:EvidenceRow[]};

const variants:Record<Variant,{title:string;short:string}>={
 A:{title:'Attract art direction',short:'Attract scene'},
 B:{title:'Scene → Evidence transition',short:'Route transition'},
 C:{title:'Evidence story small-multiples',short:'Data story'},
 D:{title:'Local → Session → Experiment ladder',short:'Evidence ladder'},
 E:{title:'Method family identity',short:'Method identity'},
 F:{title:'Sweep-head residual glow prototype',short:'Sweep glow'},
};
const active=new Set<Variant>();
let evidenceCache:EvidencePayload|null=null;
let evidenceLoading=false;
let transitionTimer:number|undefined;

const q=<T extends Element=Element>(selector:string,root:ParentNode=document)=>root.querySelector(selector) as T|null;
const qa=<T extends Element=Element>(selector:string,root:ParentNode=document)=>Array.from(root.querySelectorAll(selector)) as T[];
const has=(v:Variant)=>active.has(v);
const cls=(v:Variant)=>`ux-${v.toLowerCase()}`;

function setVariant(v:Variant,on:boolean){
 if(on)active.add(v);else active.delete(v);
 document.body.classList.toggle(cls(v),on);
 syncPanel();
 syncEnhancements();
}
function clearVariants(){([...active] as Variant[]).forEach(v=>setVariant(v,false));}
function setAll(){(Object.keys(variants) as Variant[]).forEach(v=>setVariant(v,true));}

function ensurePanel(){
 if(q('#ux-exp-panel'))return;
 const panel=document.createElement('aside');panel.id='ux-exp-panel';panel.setAttribute('aria-label','UI/UX experiment controls');
 panel.innerHTML=`<div class="ux-exp-head"><div><b>UI/UX EXPERIMENT LAB</b><small>Preview branch only · A–F</small></div><button type="button" data-ux-collapse aria-label="실험 패널 접기">−</button></div><div class="ux-exp-body"><div class="ux-exp-actions"><button type="button" data-ux-baseline>Baseline</button><button type="button" data-ux-all>All A–F</button></div><div class="ux-exp-grid">${(Object.entries(variants) as [Variant,{title:string;short:string}][]).map(([id,v])=>`<button type="button" data-ux-variant="${id}" title="${v.title}"><strong>${id}</strong><span>${v.short}</span></button>`).join('')}</div><p>프로덕션 변경이 아니라 비교용 harness입니다. 각 후보를 독립적으로 켜고 끌 수 있습니다.</p></div>`;
 document.body.appendChild(panel);
 panel.addEventListener('click',e=>{
  const t=e.target as HTMLElement;const b=t.closest('button') as HTMLButtonElement|null;if(!b)return;
  const id=b.dataset.uxVariant as Variant|undefined;
  if(id){setVariant(id,!has(id));return;}
  if(b.hasAttribute('data-ux-baseline')){clearVariants();return;}
  if(b.hasAttribute('data-ux-all')){setAll();return;}
  if(b.hasAttribute('data-ux-collapse'))panel.classList.toggle('collapsed');
 });
}
function syncPanel(){
 qa<HTMLButtonElement>('[data-ux-variant]').forEach(b=>{const id=b.dataset.uxVariant as Variant;b.classList.toggle('active',has(id));b.setAttribute('aria-pressed',String(has(id)));});
 const badge=q('.ux-exp-head small');if(badge)badge.textContent=active.size?`Active · ${[...active].join(' ')}`:'Preview branch only · baseline';
}

function ensureAttractArt(){
 qa<HTMLElement>('.viewer').forEach(viewer=>{
  const isAttract=viewer.classList.contains('attract');
  let art=q<HTMLElement>('.ux-attract-art',viewer);
  if(!has('A')||!isAttract){art?.remove();return;}
  if(!art){art=document.createElement('div');art.className='ux-attract-art';art.innerHTML=`<span class="ux-attract-kicker">ECG DENOISING · LIVE STORY</span><strong>Noise <i>→</i> Signal <i>→</i> Insight</strong><small>같은 ECG · 같은 시간축 · 다른 잡음 제거 결과</small>`;viewer.prepend(art);}
 });
}

function triggerRouteTransition(direction:'evidence'|'lab'){
 if(!has('B'))return;
 q('.ux-route-curtain')?.remove();window.clearTimeout(transitionTimer);
 const el=document.createElement('div');el.className='ux-route-curtain';el.innerHTML=direction==='evidence'?`<small>FROM ONE SCENE</small><strong>→</strong><span>ALL EVIDENCE</span>`:`<small>FROM ALL EVIDENCE</small><strong>→</strong><span>ONE SCENE</span>`;document.body.appendChild(el);
 requestAnimationFrame(()=>el.classList.add('show'));transitionTimer=window.setTimeout(()=>el.remove(),850);
}
function installRouteListener(){
 document.addEventListener('click',e=>{
  const target=(e.target as HTMLElement).closest('button,a') as HTMLElement|null;if(!target)return;const txt=(target.textContent||'').trim();
  if(txt.includes('전체 근거'))triggerRouteTransition('evidence');
  else if(txt==='실험실'||txt.includes('실험실'))triggerRouteTransition('lab');
 },true);
}

function evidenceAnchor(){
 const heading=qa<HTMLElement>('h1,h2').find(el=>(el.textContent||'').includes('전체 실험'));
 const table=q<HTMLTableElement>('table');
 return {heading,table,host:table?.parentElement||heading?.parentElement?.parentElement||null};
}
function ensureEvidenceLadder(){
 const {host,table,heading}=evidenceAnchor();
 let el=q<HTMLElement>('.ux-evidence-ladder');
 if(!has('D')||!heading||!host){el?.remove();return;}
 if(el)return;
 el=document.createElement('section');el.className='ux-evidence-ladder';el.innerHTML=`<div class="ux-ladder-label">EVIDENCE SCALE · 같은 숫자가 아니라 서로 다른 범위</div><div class="ux-ladder-steps"><article><b>01</b><strong>Local</strong><span>현재 보이는 10초 장면</span><small>파형 · 선택 시각 · 즉시 비교</small></article><i>→</i><article><b>02</b><strong>Session</strong><span>연속 600초 재생 범위</span><small>Preview Lite에서는 생략 · full release에서 검증</small></article><i>→</i><article><b>03</b><strong>Experiment</strong><span>EXP-A · TEST 22</span><small>record-level aggregate · 현재 장면과 범위가 다름</small></article></div>`;
 host.insertBefore(el,table||host.firstChild);
}

async function loadEvidence(){
 if(evidenceCache||evidenceLoading)return;evidenceLoading=true;
 try{const r=await fetch('./evidence-lite.json');if(!r.ok)throw Error(String(r.status));evidenceCache=await r.json() as EvidencePayload;}catch{evidenceCache={rows:[]};}finally{evidenceLoading=false;syncEnhancements();}
}
function fmt(x:number){const a=Math.abs(x);return a>=10?x.toFixed(1):a>=1?x.toFixed(2):x.toFixed(3);}
function ensureEvidenceStory(){
 const {host,table,heading}=evidenceAnchor();let wrap=q<HTMLElement>('.ux-evidence-story');
 if(!has('C')||!heading||!host){wrap?.remove();return;}
 if(!evidenceCache){loadEvidence();return;}
 if(wrap)return;
 const rows=evidenceCache.rows||[];const preferred=['snr_imp_scaled','rmse','prd','corr','ssim','qrs_f1'];const metrics=[...new Set(rows.map(r=>r.metric))];const selected=[...preferred.filter(m=>metrics.includes(m)),...metrics.filter(m=>!preferred.includes(m))].slice(0,4);
 wrap=document.createElement('section');wrap.className='ux-evidence-story';
 const methodSet=['M_FE','M01','M03','M04','M06','M08','M09'];
 const cards=selected.map(metric=>{
  const group=rows.filter(r=>r.metric===metric&&methodSet.includes(r.method));if(!group.length)return '';
  const label=group[0].label||metric,dir=group[0].dir||'';const vals=group.map(r=>r.mean).filter(Number.isFinite),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1e-9,max-min);
  return `<article><header><div><b>${label}</b><small>${dir==='↓'?'낮을수록':'높을수록'} · mean</small></div><span>${dir}</span></header><div class="ux-metric-bars">${group.map(r=>{const pct=12+76*((r.mean-min)/range);return `<div class="ux-metric-row"><code>${r.method}</code><i><em style="width:${pct}%"></em><u style="left:${pct}%"></u></i><strong>${fmt(r.mean)}</strong></div>`;}).join('')}</div></article>`;
 }).join('');
 wrap.innerHTML=`<div class="ux-story-heading"><div><span>RESULT STORY · SMALL MULTIPLES</span><h2>한 숫자의 우승자가 아니라, 지표마다 달라지는 trade-off를 봅니다.</h2></div><p>막대 길이는 <b>각 카드 안에서만</b> 위치를 돕습니다. 서로 다른 단위의 카드끼리 길이를 비교하지 마세요. 정확한 값은 오른쪽 숫자입니다.</p></div><div class="ux-story-grid">${cards||'<p>Preview evidence summary를 읽지 못했습니다.</p>'}</div><footer>${evidenceCache.experiment||'EXP-A'} · ${evidenceCache.axis||'D1'} · ${evidenceCache.scope||'aggregate evidence'}</footer>`;
 host.insertBefore(wrap,table||host.firstChild);
}

function familyBucket(family:string){const s=family.toLowerCase();if(s.includes('wavelet'))return'wavelet';if(s.includes('deep')||s.includes('transformer'))return'dl';if(s.includes('hybrid'))return'hybrid';if(s.includes('classical'))return'classical';if(s.includes('model'))return'model';if(s.includes('oracle'))return'oracle';if(s.includes('baseline')||s.includes('identity'))return'baseline';return'other';}
function ensureMethodIdentity(){
 const data=methodData as Record<string,{family:string}>;
 qa<HTMLButtonElement>('.method[data-method]').forEach(b=>{
  const id=b.dataset.method||'';const info=data[id];if(!info)return;b.dataset.uxFamily=familyBucket(info.family);
  let badge=q<HTMLElement>('.ux-method-family',b);if(!badge){badge=document.createElement('small');badge.className='ux-method-family';badge.textContent=info.family.split('·')[0].trim();b.appendChild(badge);}
 });
}

function isPlaying(){return qa<HTMLButtonElement>('button').some(b=>/일시정지|pause/i.test((b.textContent||'').trim()));}
function ensureSweepGlow(){
 document.body.classList.toggle('ux-playing',isPlaying());
 const attract=!!q('.viewer.attract');document.body.style.setProperty('--ux-sweep-duration',attract?'10s':'5s');
 qa<HTMLCanvasElement>('.viewer canvas').forEach(canvas=>{
  const parent=canvas.parentElement;if(!parent)return;parent.classList.add('ux-canvas-shell');let glow=q<HTMLElement>('.ux-sweep-glow',parent);if(!glow){glow=document.createElement('div');glow.className='ux-sweep-glow';glow.setAttribute('aria-hidden','true');parent.appendChild(glow);}
 });
}

function syncEnhancements(){
 ensurePanel();
 ensureAttractArt();
 ensureEvidenceLadder();
 ensureEvidenceStory();
 ensureMethodIdentity();
 ensureSweepGlow();
}

installRouteListener();
ensurePanel();
const observer=new MutationObserver(()=>syncEnhancements());observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed']});
window.setInterval(syncEnhancements,700);
syncEnhancements();
