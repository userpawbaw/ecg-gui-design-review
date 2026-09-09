/* Standalone offline GUI. All named method traces come from the pinned source bank. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const bank = window.ECG_BANK, core = window.ECGCore;
  const methods = {
    M00:{name:'무처리',family:'Identity · 입력 그대로',principle:'입력을 그대로 반환하는 기준입니다. 아무 처리도 하지 않았을 때와 비교합니다.',limit:'scaled SNR은 무처리에서도 배율 보정으로 증가할 수 있습니다.'},
    M_FE:{name:'공통 Front-end',family:'Baseline · 대역 제한',principle:'원본 파이프라인의 공통 전처리 결과입니다. 추가 denoiser의 기여를 판단하는 기준입니다.',limit:'현재 코드 기준 0.5–100 Hz와 조건부 notch. 저장 결과의 재생성 여부는 별도 확인해야 합니다.'},
    M01:{name:'Bandpass + Notch',family:'Classical · 주파수 선택',principle:'대역 제한과 전원 간섭 억제를 조합합니다. 비교 비용이 낮은 기본 DSP 방법입니다.',limit:'잡음과 ECG의 주파수 대역이 겹치면 둘을 완전히 분리할 수 없습니다.'},
    M02:{name:'Savitzky–Golay',family:'Classical · 국소 다항식',principle:'짧은 구간의 다항식 적합으로 신호를 평활화합니다. 연산이 단순한 비교 기준입니다.',limit:'창 크기가 커지면 QRS의 폭과 작은 굴곡도 달라질 수 있습니다.'},
    M03:{name:'DWT threshold',family:'Wavelet · decimated',principle:'다운샘플링하는 DWT의 계수를 축소하여 재구성합니다. SWT와 이동 민감도·중복 표현의 효과를 비교합니다.',limit:'신호의 시간 이동에 따라 계수와 임계값 적용 결과가 달라질 수 있습니다.'},
    M04:{name:'Adaptive SWT',family:'Wavelet · 시간–주파수',principle:'SWT 계수를 대역별 임계값으로 줄여 국소 잡음을 억제합니다. ECG의 급격한 변화가 함께 줄어드는지 관찰합니다.',limit:'작은 P/T 성분과 고주파 잡음의 구분은 조건에 따라 달라집니다.'},
    M05:{name:'Sameni EKF / EKS',family:'Model-based · 상태 추정',principle:'ECG의 위상·형태 모델과 관측을 결합합니다. 주기적 구조를 이용해 상태를 추정합니다.',limit:'실제 형태가 모델 가정에서 벗어나면 파형이 바뀔 수 있습니다. 오프라인 EKS와 causal EKF의 지연도 다릅니다.'},
    M06:{name:'Residual U-Net',family:'Deep learning · L1',principle:'다중 해상도 특징으로 잡음을 추정하는 1D U-Net입니다. 입력에서 추정 성분을 빼는 residual 구조를 사용합니다.',limit:'학습 범위 밖의 장비·리듬·잡음에서 같은 성능을 보장하지 않습니다.'},
    M06L6:{name:'Residual U-Net · L6',family:'Loss ablation · 보조 실험',principle:'M06과 같은 구조에 깨끗한 입력의 변형을 줄이는 손실 항을 더한 비교입니다. 현재 SNR에서 L1 출력과 나란히 확인하세요.',limit:'EXP-G 보조 비교입니다. 학습 실행·checkpoint가 다르므로 화면 한 장으로 손실 항만의 인과 효과를 완전히 입증하지 않습니다.'},
    M08:{name:'Wavelet U-Net',family:'Hybrid · subband 입력',principle:'웨이블릿으로 나눈 대역 정보를 신경망의 입력 표현으로 사용합니다. SWT 처리 결과를 순차 입력하는 M07과 다른 구조입니다.',limit:'시각적으로 매끄러운 출력만으로 형태 보존을 판정할 수 없습니다.'},
    M09:{name:'CNN + Transformer',family:'Deep learning · 문맥 모델',principle:'CNN의 국소 특징과 attention의 문맥 정보를 함께 사용합니다. 같은 구간에서 추가 문맥의 효과를 살펴봅니다.',limit:'더 큰 모델과 더 긴 문맥이 모든 조건에서 추가 이득을 의미하지는 않습니다.'},
    B01:{name:'Oracle wavelet',family:'Oracle · 참조 필요',principle:'참조를 이용해 wavelet threshold를 고르는 비교용 기준입니다. 실제 적용 가능한 방법과 구별해 읽습니다.',limit:'참조가 없는 실제 장치에 적용할 수 없습니다. 모든 가능한 알고리즘의 보편적 상한은 아닙니다.'}
  };
  const extraNames={M07:'SWT → U-Net',M10:'Dilated ResNet',B02:'Oracle Wiener',M04np:'SWT · no protection',M05f:'Sameni EKF'};
  const noiseNames={mixed:'혼합 잡음',pli:'전원 간섭',ma_synth:'근육 잡음',em_synth:'전극 움직임',bw_synth:'기저선 변동',impulse:'임펄스 잡음',awgn:'백색 가우시안 잡음'};
  const state={workspace:'lab',axis:'d1',noise:'mixed',snr:10,method:'M08',comparison:'M04',start:3,length:1.2,amplitude:2,view:'dual',playing:false,presentation:false};
  let scene, traces, preview=null, statusTimer, animation, playOrigin=0, cursorTime=0, dataReady=false;
  const cache=new Map();
  const reviewEvents=[];
  const number=(v,d=2)=>v===null||v===undefined||Number.isNaN(v)?'—':v===Infinity?'∞':v===-Infinity?'−∞':v.toFixed(d);
  const selection=()=>core.selection(state.start,state.length,bank.fs,bank.n);
  function announce(message){reviewEvents.push({at:new Date().toISOString(),type:'UI',message});if(reviewEvents.length>50)reviewEvents.shift();$('status').textContent=message;$('status').classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('status').classList.remove('visible'),4200);}
  function setPlaying(playing){
    if(playing&&!dataReady)return;
    state.playing=playing;cancelAnimationFrame(animation);$('play').setAttribute('aria-pressed',String(playing));$('play').textContent=playing?'Ⅱ 커서 정지':'▶ 커서 재생';
    $('replay-play').setAttribute('aria-pressed',String(playing));$('replay-play').textContent=playing?'Ⅱ 커서 정지':'▶ 커서 재생';
    if(playing){playOrigin=performance.now();cursorTime=0;animation=requestAnimationFrame(tick);}
  }
  function tick(now){
    if(!state.playing)return;
    cursorTime=Math.min(10,(now-playOrigin)/1000);
    document.querySelectorAll('[data-play-cursor]').forEach(line=>{const x=94+cursorTime/10*844;line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('opacity','0.8');});
    if(cursorTime>=10){setPlaying(false);announce('저장 구간 10초 재생이 끝났습니다.');return;}
    animation=requestAnimationFrame(tick);
  }
  function currentScene(){
    if(!bank||!core) throw Error('데이터 파일을 읽지 못했습니다. data 폴더와 함께 압축을 푼 뒤 다시 여세요.');
    const s=bank.scenes.find(s=>s.axis===state.axis&&s.cond===state.noise&&s.snr===state.snr);
    if(!s) throw Error('선택한 조합의 저장 결과가 없습니다.');
    if(!cache.has(s.id)){
      const decoded={};
      for(const [key,value] of Object.entries(s.traces)){
        try{decoded[key]=core.decode(value,s.scale,bank.n);}catch{decoded[key]=null;}
      }
      if(!decoded.clean||!decoded.input)throw Error('입력 또는 참조 파형이 손상되었습니다. 이 조건의 결과를 표시할 수 없습니다.');
      decoded.M00=decoded.input;cache.set(s.id,decoded);
    }
    scene=s;traces=cache.get(s.id);dataReady=true;
  }
  function pathFor(arr,{first=0,last=bank.n,x=94,y=0,width=844,height=83,amplitude=state.amplitude}={}){
    const points=[];for(let i=first;i<last;i++) points.push(`${i===first?'M':'L'}${(x+(i-first)/(last-first)*width).toFixed(2)},${(y+height/2-arr[i]/amplitude*(height/2)).toFixed(2)}`);
    return points.join('');
  }
  function tracePath(arr,opts,color,dashed=false){return `<path d="${pathFor(arr,opts)}" fill="none" stroke="${color}" stroke-width="1.35" ${dashed?'stroke-dasharray="4 3"':''} vector-effect="non-scaling-stroke"/>`;}
  function renderGraph(){
    if(!dataReady||!traces)return;
    const sel=selection(), rows=[['input','입력','#ffbc79'],['M_FE','공통 FE','#b1c8d4']];
    if(!['M_FE',state.method,'none'].includes(state.comparison))rows.push([state.comparison,state.comparison,'#97c2ff']);
    if(state.method!=='M_FE')rows.push([state.method,state.method,'#67e7c3']);
    const height=rows.length*99+40;
    let svg=`<svg viewBox="0 0 960 ${height}" role="img" aria-label="입력, 공통 FE, 비교 방법, 선택 출력의 동일한 시간과 진폭축 비교"><title>공통 축 ECG 비교</title><desc>저장 중앙 10초, mV 단위. 아래 숫자 입력으로 구간을 선택할 수 있습니다.</desc>`;
    svg+='<defs>'+rows.map((_,i)=>`<clipPath id="row-clip-${i}"><rect x="94" y="${i*99+8}" width="844" height="83"/></clipPath>`).join('')+'</defs>';
    rows.forEach(([key,label,color],i)=>{
      const y=i*99+8;
      svg+=`<text x="5" y="${y+25}" fill="${color}" font-size="17" font-weight="600">${label}</text><text x="5" y="${y+45}" fill="#a9c0cb" font-size="13">±${state.amplitude} mV</text>`;
      for(let t=0;t<=10;t++) svg+=`<line x1="${94+t*84.4}" x2="${94+t*84.4}" y1="${y}" y2="${y+83}" stroke="#304954" stroke-width=".7"/>`;
      for(let f=0;f<=4;f++) svg+=`<line x1="94" x2="938" y1="${y+f*20.75}" y2="${y+f*20.75}" stroke="#304954" stroke-width=".7"/>`;
      svg+=`<rect x="${94+sel.start/10*844}" y="${y}" width="${sel.length/10*844}" height="83" fill="#79d7bf" opacity=".12"/><line x1="${94+sel.start/10*844}" x2="${94+sel.start/10*844}" y1="${y}" y2="${y+83}" stroke="#7dcab5" opacity=".75"/>`;
      svg+=`<g clip-path="url(#row-clip-${i})">`;
      if(i>0)svg+=tracePath(traces.clean,{y},'#d4caff',true);
      if(traces[key])svg+=`<g data-trace="${key}">`+tracePath(traces[key],{y},color)+'</g>';
      else svg+=`<text x="115" y="${y+45}" fill="#ffbc79" font-size="13">저장 출력 없음 또는 손상 · 다른 방법은 계속 비교할 수 있습니다.</text>`;
      if(key===state.method&&preview&&preview!==state.method&&traces[preview])svg+=tracePath(traces[preview],{y},'#f8d39a',true);
      svg+='</g>';
    });
    for(let t=0;t<=10;t+=2)svg+=`<text x="${94+t*84.4}" y="${height-13}" text-anchor="middle" fill="#b0c6d1" font-size="14">${t}${t===10?' s':''}</text>`;
    svg+=`<line data-play-cursor x1="94" x2="94" y1="8" y2="${height-50}" stroke="#f6fbfc" stroke-width="1.2" opacity="0"/><line data-hover-cursor x1="94" x2="94" y1="8" y2="${height-50}" stroke="#f8d39a" stroke-dasharray="3 4" opacity="0"/>`;
    svg+='</svg>';$('waveform').innerHTML=svg;
    const clipCount=rows.reduce((count,[key])=>count+(traces[key]?.filter(v=>Math.abs(v)>state.amplitude).length||0),0)+(rows.length-1)*traces.clean.filter(v=>Math.abs(v)>state.amplitude).length;
    $('clip-status').textContent=clipCount?`범위 밖 ${clipCount}개 표시 표본 · 범위 맞춤 가능`:`공통 진폭 ±${state.amplitude} mV`;
  }
  function renderMetrics(){
    const m=core.metrics(traces.clean,traces[state.method],traces.input);
    $('strict').textContent=m?number(m.strict)+' dB':'—';$('scaled').textContent=m?number(m.scaled)+' dB':'—';$('alpha').textContent=m?number(m.alpha,3):'—';$('cc').textContent=m?number(m.cc,4):'—';
    const fe=core.metrics(traces.clean,traces.M_FE,traces.input);
    $('contribution').textContent=m&&fe?`${state.method} · 입력 대비 strict SNR 개선 ${number(m.strict-m.input)} dB / FE 대비 추가 차이 ${number(m.strict-fe.strict)} dB. 전체 10초의 국소 비교입니다.`:'선택 출력 또는 FE 출력이 없어 추가 기여를 계산할 수 없습니다.';
    const ids=[...new Set(['M_FE',state.comparison,state.method])].filter(id=>methods[id]);
    $('scene-evidence-table').innerHTML=ids.map(id=>{const v=core.metrics(traces.clean,traces[id],traces.input);return `<tr><td>${id}${id==='M06L6'?' · 보조 L6':id==='B01'?' · oracle':''}</td><td>${v?number(v.scaled-v.input):'—'}</td><td>${number(scene.ref_mean?.[id])}</td></tr>`;}).join('');
  }
  function renderFocus(){
    if(!dataReady||!traces)return;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
    const s=selection();state.start=s.start;state.length=s.length;$('start').value=number(s.start,2);$('start').max=10-s.length;
    $('selection-label').textContent=`${number(s.start)}–${number(s.end)} s · ${s.last-s.first} samples`;
    $('previous').disabled=s.first===0;$('next').disabled=s.last===bank.n;
    if(!traces[state.method]){
      $('detail-waveform').innerHTML='<p class="notice">선택한 방법의 저장 출력이 없어 확대할 수 없습니다. 다른 방법을 선택하세요.</p>';
      $('focus-metrics').innerHTML='';$('focus-method').textContent=state.method+' · 출력 없음';$('focus-explanation').textContent='입력과 정상 출력은 위에서 계속 비교할 수 있습니다.';return;
    }
    if(state.view==='dual'){
      let svg='<svg viewBox="0 0 930 242" role="img" aria-label="선택한 동일 구간: 왼쪽 입력과 출력, 오른쪽 참조와 출력">';
      [['입력과 출력','input','#bd702e'],['참조와 출력','clean','#796395']].forEach(([title,key,color],i)=>{
        const x=42+i*465,w=412,h=172,y=30,opt={first:s.first,last:s.last,x,y,width:w,height:h};
        svg+=`<defs><clipPath id="dual-clip-${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><text x="${x}" y="18" font-size="12" fill="#344f45" font-weight="600">${title}</text>`;
        for(let t=0;t<=4;t++){svg+=`<line x1="${x+t*w/4}" x2="${x+t*w/4}" y1="${y}" y2="${y+h}" stroke="#dce6e0"/><line x1="${x}" x2="${x+w}" y1="${y+t*h/4}" y2="${y+t*h/4}" stroke="#dce6e0"/>`;}
        svg+=`<g clip-path="url(#dual-clip-${i})">`+tracePath(traces[key],opt,color,key==='clean')+tracePath(traces[state.method],opt,'#087763')+'</g>';
        svg+=`<text x="${x}" y="224" font-size="11" fill="#5a7068">${number(s.start)} s</text><text x="${x+w}" y="224" text-anchor="end" font-size="11" fill="#5a7068">${number(s.end)} s</text><text x="${x-6}" y="${y+10}" text-anchor="end" font-size="10" fill="#5a7068">+${state.amplitude}</text><text x="${x-6}" y="${y+h}" text-anchor="end" font-size="10" fill="#5a7068">−${state.amplitude}</text>`;
      });
      $('detail-waveform').innerHTML=svg+'</svg>';
    }else{
    const opt={first:s.first,last:s.last,x:50,y:7,width:850,height:184};
    let svg=`<svg viewBox="0 0 930 220" role="img" aria-label="선택한 ${number(s.start)}초부터 ${number(s.end)}초의 ${state.view==='overlay'?'출력과 참조':'제거 성분'}"><defs><clipPath id="focus-clip"><rect x="50" y="7" width="850" height="184"/></clipPath></defs>`;
    for(let t=0;t<=10;t++)svg+=`<line x1="${50+t*85}" x2="${50+t*85}" y1="7" y2="191" stroke="#dce6e0" stroke-width=".8"/>`;
    for(let t=0;t<=4;t++)svg+=`<line x1="50" x2="900" y1="${7+t*46}" y2="${7+t*46}" stroke="#dce6e0" stroke-width=".8"/>`;
    svg+=`<text x="5" y="18" font-size="10" fill="#5a7068">+${state.amplitude}</text><text x="21" y="103" font-size="10" fill="#5a7068">0</text><text x="5" y="185" font-size="10" fill="#5a7068">−${state.amplitude}</text><g clip-path="url(#focus-clip)">`;
    if(state.view==='overlay')svg+=tracePath(traces.clean,opt,'#766596',true)+tracePath(traces[state.method],opt,'#087763');
    else svg+=tracePath(traces.input.map((v,i)=>v-traces[state.method][i]),opt,'#a05a22');
    svg+='</g>';
    for(let t=0;t<=4;t++)svg+=`<text x="${50+t*212.5}" y="212" font-size="10" text-anchor="middle" fill="#5a7068">${number(s.start+t*s.length/4,2)} s</text>`;
    svg+='</svg>';$('detail-waveform').innerHTML=svg;
    }
    const m=core.metrics(traces.clean.slice(s.first,s.last),traces[state.method].slice(s.first,s.last));
    $('focus-method').textContent=state.method+' · '+methods[state.method].name;
    $('focus-explanation').textContent=state.view==='dual'?'왼쪽: 입력 대비 변화를, 오른쪽: 참조 대비 형태 차이를 확인합니다. 청록 실선은 같은 출력입니다.':state.view==='overlay'?'청록 실선: 출력 / 보라 점선: 참조. 작은 굴곡과 진폭의 차이를 같은 축에서 확인하세요.':'제거 성분 = 입력 − 출력. 남은 ECG 성분과 기준선도 포함될 수 있어, 전부 잡음이라고 단정할 수 없습니다.';
    if(state.view==='residual'){
      const clipped=traces.input.slice(s.first,s.last).filter((v,i)=>Math.abs(v-traces[state.method][s.first+i])>state.amplitude).length;
      if(clipped)$('focus-explanation').textContent+=` 현재 진폭 범위 밖 ${clipped} samples. 범위 맞춤으로 모두 볼 수 있습니다.`;
    }
    $('focus-metrics').innerHTML=`<div><dt>구간 RMSE</dt><dd>${m?number(m.rmse,4):'—'} mV</dd></div><div><dt>구간 CC</dt><dd>${m?number(m.cc,4):'—'}</dd></div>`;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
  }
  function renderMethodDetail(){
    const id=preview||state.method,m=methods[id];
    $('method-detail').innerHTML=`<div class="preview-label">${preview&&preview!==state.method?'미리보기 · 클릭하면 선택':'선택한 방법'}</div><h3>${id} · ${m.name}</h3><p>${m.principle}</p><p class="limitation">${m.limit}</p>`;
    $('preview-indicator').textContent=preview&&preview!==state.method?`노란 점선: ${preview} 미리보기 / 고정 선택: ${state.method}`:`선택: ${state.method} · 클릭으로 고정`;
  }
  function renderAll(){
    try {
      currentScene();$('data-error').hidden=true;
      ['fit','play','export-open','provenance-open'].forEach(id=>$(id).disabled=false);
      $('record').textContent=state.axis==='d1'?'MIT-BIH '+scene.record:'Synthetic '+scene.record;
      $('context-label').textContent=`${state.axis==='d1'?'MIT-BIH '+scene.record+' · TEST · 참조 FE(x_raw)':'합성 ECG '+scene.record+' · D0'} / ${noiseNames[state.noise]} / 주입 ${state.snr} dB / 250 Hz · 상대 시간`;
      $('snr-slider').value=state.snr;$('snr-slider').setAttribute('aria-valuetext',state.snr+' dB');
      document.querySelectorAll('[data-snr]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.snr===state.snr)));
      document.querySelectorAll('[data-method]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.method===state.method)));
      renderGraph();renderMetrics();renderFocus();renderMethodDetail();
    }catch(error){
      setPlaying(false);dataReady=false;traces=null;$('data-error').hidden=false;$('data-error').textContent=error.message;
      const retry=document.createElement('button');retry.textContent='저장 자료 다시 확인';retry.onclick=()=>{cache.clear();renderAll();};$('data-error').append(retry);
      ['waveform','detail-waveform','focus-metrics','scene-evidence-table'].forEach(id=>$(id).innerHTML='');
      ['strict','scaled','alpha','cc','record','focus-method'].forEach(id=>$(id).textContent='—');
      $('context-label').textContent='선택 조건의 결과를 표시할 수 없습니다.';$('focus-explanation').textContent='입력 자료를 확인한 뒤 다시 시도하세요.';$('contribution').textContent='결과 없음';
      ['fit','play','export-open','provenance-open'].forEach(id=>$(id).disabled=true);
    }
  }
  function changeScene(){const oldRecord=scene?.record;preview=null;setPlaying(false);renderAll();announce(`${noiseNames[state.noise]} / 주입 ${state.snr} dB 저장 결과.${oldRecord!==scene?.record?' 기록도 '+scene?.record+'로 바뀌었습니다.':' 기록과 선택 구간을 유지했습니다.'}`);}
  function moveSelection(start){if(!dataReady)return;const prior=start,s=core.selection(start,state.length,bank.fs,bank.n);state.start=s.start;renderGraph();renderFocus();announce(`${number(s.start)}–${number(s.end)}초 선택${Math.abs(prior-s.start)>.01?' · 유효 범위로 조정':''}`);}
  function showWorkspace(workspace){
    state.workspace=workspace;setPlaying(false);
    ['lab','evidence','acquisition'].forEach(id=>$(id).hidden=id!==workspace);
    document.querySelectorAll('[data-workspace]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspace===workspace)));
    if(workspace==='evidence')renderEvidence();
    if(workspace==='acquisition')renderAcquisition();
  }
  function renderEvidence(){
    if(!bank?.evidence){$('evidence-bars').textContent='집계 자료가 없습니다.';return;}
    const rows=bank.evidence.rows.filter(r=>r.metric==='snr_imp_scaled');
    const name=id=>methods[id]?.name||extraNames[id]||id;
    $('evidence-bars').innerHTML=rows.map(r=>`<div class="bar-row ${['M00','M_FE'].includes(r.method)?'baseline':''} ${r.method.startsWith('B')?'oracle':''}"><span>${r.method} · ${name(r.method)}${r.method.startsWith('B')?' · 참조 필요':''}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(0,r.mean)/20*100}%"></div></div><strong>${number(r.mean)}</strong></div>`).join('');
    $('evidence-table').innerHTML=rows.map(r=>`<tr><td>${r.method} · ${name(r.method)}${r.method.startsWith('B')?' · oracle':''}</td><td>${r.n}</td><td>${number(r.mean,3)}</td><td>${number(r.std,3)}</td><td>${number(r.median,3)}</td></tr>`).join('');
  }
  function renderAcquisition(){
    const text={disconnected:'미연결 · 장치·세션 정보를 확인한 뒤 실제 연결 어댑터에서 시작합니다.',warmup:'미리보기 / 워밍업 · 새 버퍼가 준비될 때까지 이전 출력과 지표를 현재 결과로 표시하지 않습니다.','lead-off':'미리보기 / 전극 접촉 해제 · 영향받은 구간을 invalid로 표시하고 접촉 복구를 안내합니다.',gap:'미리보기 / 표본 유실 · i와 ok mask로 간격을 남깁니다. 유실 구간을 이어 그리지 않습니다.',reset:'미리보기 / FE 변경 · 이전 결과를 지우고 새 지연·모드 metadata와 함께 워밍업합니다.'};
    $('acquisition-state').textContent=text[$('acquisition-scenario').value];
    if(!$('replay-area').hidden){setPlaying(false);renderReplay();}
  }
  function renderReplay(){
    if(!dataReady||!traces){$('replay-note').textContent='실험실의 저장 입력을 불러온 뒤 다시 확인하세요.';$('replay-wave').innerHTML='';return;}
    const scenario=$('acquisition-scenario').value,gap=['gap','lead-off'].includes(scenario),waiting=['warmup','reset'].includes(scenario);
    $('replay-source').textContent=`${scene.id} · record ${scene.record} · 250 Hz · 상대 시간 · ${state.method}`;
    let svg='<svg viewBox="0 0 960 248" role="img" aria-label="저장 파형 재생으로 표현한 취득 화면; 실제 장치 신호가 아님"><defs><clipPath id="replay-input-clip"><rect x="94" y="13" width="844" height="83"/></clipPath><clipPath id="replay-output-clip"><rect x="94" y="116" width="844" height="83"/></clipPath><mask id="replay-valid-mask"><rect width="960" height="248" fill="white"/>'+(gap?'<rect x="431.6" y="0" width="84.4" height="248" fill="black"/>':'')+'</mask></defs>';
    [['input','저장 입력','#ffbc79'],[state.method,'저장 출력','#67e7c3']].forEach(([key,label,color],i)=>{
      const y=13+i*103;svg+=`<text x="5" y="${y+30}" fill="${color}" font-size="16">${label}</text>`;
      for(let t=0;t<=10;t++)svg+=`<line x1="${94+t*84.4}" x2="${94+t*84.4}" y1="${y}" y2="${y+83}" stroke="#304954"/>`;
      svg+=`<line x1="94" x2="938" y1="${y+41.5}" y2="${y+41.5}" stroke="#4a626d"/>`;
      if(i===1&&(waiting||!traces[key]))svg+=`<text x="115" y="${y+45}" fill="#c1d1d8" font-size="14">${waiting?'새 모드 준비 중 · 이전 출력 표시 안 함':'저장 출력 없음'}</text>`;
      else svg+=`<g clip-path="url(#replay-${i?'output':'input'}-clip)" mask="url(#replay-valid-mask)">`+tracePath(traces[key],{y},color)+'</g>';
    });
    if(gap)svg+='<rect x="431.6" y="13" width="84.4" height="186" fill="#f8b670" opacity=".12"/><text x="473.8" y="227" text-anchor="middle" font-size="12" fill="#ffbc79">4–5 s · invalid 시연</text>';
    else for(let t=0;t<=10;t+=2)svg+=`<text x="${94+t*84.4}" y="227" text-anchor="middle" font-size="12" fill="#b0c6d1">${t} s</text>`;
    svg+='<line data-play-cursor x1="94" x2="94" y1="13" y2="199" stroke="#f4f8fb" opacity="0"/></svg>';
    $('replay-wave').innerHTML=svg;$('replay-note').textContent=gap?'4–5초 구간은 상태 표현을 점검하기 위해 의도적으로 가린 UI fixture입니다. 원본 기록에서 실제 유실이 있었다는 뜻이 아닙니다.':waiting?'워밍업·FE 초기화 시 저장 입력만 남기고 이전 출력은 숨기는 동작을 보여줍니다.':`실제 저장 파형의 표시 예시 · 모든 행 ±${state.amplitude} mV. 이 파형이나 커서로 실제 장치 연결을 증명하지 않습니다.`;
  }
  function openProvenance(){
    if(!dataReady)return;
    if(state.workspace==='evidence'){
      $('provenance-content').innerHTML=`<div class="notice">현재 화면: D1 · EXP-A · 주 실험 L1의 원본 집계표</div><p><code>${bank.provenance.sourceCommit}</code></p><p>파일: results/d1/report/table_main.csv. TEST 22 records, mixed noise, 주입 −5…20 dB의 record 단위 집계입니다. 평균·표준편차·중앙값을 표시합니다.</p><p>전체 근거 표를 현재 실험실의 EXP-G 장면이나 25 dB·L6 보조 실험과 같은 실행 결과로 취급하지 않습니다. 원본 계산을 이 작업에서 다시 실행하지 않았습니다.</p>`;
      $('provenance').showModal();return;
    }
    if(state.workspace==='acquisition'){
      $('provenance-content').innerHTML='<div class="notice">현재 화면: 실제 장치 미연결 · UI 상태 미리보기</div><p>장치 sourceMode/sessionId, 원본 timestamp, lead, packet denominator, end-to-end latency는 수신하거나 측정하지 않았습니다.</p><p>상태 선택은 실제 장치 이벤트가 아닙니다. 저장 실험실의 성능 수치도 이 계측 화면에 적용하지 않습니다.</p>';
      $('provenance').showModal();return;
    }
    setPlaying(false);const s=selection();const metric=core.metrics(traces.clean,traces[state.method],traces.input);
    $('provenance-content').innerHTML=`<div class="notice">ARCHIVED · builder hash 일치 / dataset hash 불일치. 현재 소스로 재생성한 결과라고 주장하지 않습니다.</div><dl><div><dt>원본 저장소</dt><dd>${bank.provenance.repository}<br><code>${bank.provenance.sourceCommit}</code></dd></div><div><dt>파형 파일</dt><dd>demo/demo_bank.js<br><code>${bank.provenance.sourceBlob}</code></dd></div><div><dt>현재 장면</dt><dd>${scene.id} · record ${scene.record} · segment ${scene.seg}<br>선택 ${number(s.start)}–${number(s.end)} s / ${state.method}</dd></div><div><dt>참조</dt><dd>${state.axis==='d1'?'FE(x_raw): 대역 제한된 실제 ECG 참조. 완전히 깨끗한 환자 ground truth가 아닙니다.':'원본 프로젝트에서 생성한 합성 ECG 참조.'}</dd></div><div><dt>SNR 규약</dt><dd>주입값 ${state.snr} dB (nominal). 현재 참조 기준 입력 SNR ${metric?number(metric.input):'—'} dB.<br>모든 재계산 지표는 각 신호의 평균을 제거합니다. α는 잔여 잡음에도 영향을 받는 최소제곱 출력 배율입니다.</dd></div><div><dt>시간·정밀도</dt><dd>20초 처리 중 양끝 5초 제외, 중앙 10초. 표시는 저장 배열 시작 기준 상대 시간.<br>int16 양자화 파형에서 재계산하므로 원본 float 지표와 소폭 다를 수 있습니다.</dd></div><div><dt>장면 선정</dt><dd>10 dB에서 여러 방법의 축 평균과 가까운 대표 구간을 선택한 저장 결과입니다. 결과를 사용한 선택이므로 독립 무작위 표본은 아닙니다.<br>후보 수 ${scene.selection?.n_candidates??'미기록'} / 저장 contrast rank ${scene.selection?.contrast_rank??'미기록'}.</dd></div><div><dt>미제공 metadata</dt><dd>export의 정확한 seed, lead, annotation, checkpoint hash, record 절대 시작 timestamp.</dd></div></dl><h3>전체 결과와의 관계</h3><p>실험실의 reference mean은 EXP-G에 속합니다. 전체 근거 화면은 EXP-A 원본 집계표이므로 같은 실험의 짝지은 값처럼 빼거나 순위를 합치지 않습니다.</p>`;
    $('provenance').showModal();
  }
  function snapshot(){
    const s=selection(),m=core.metrics(traces.clean,traces[state.method],traces.input);
    return {schema:'ecg-gui-review/1',createdAt:new Date().toISOString(),kind:'GUI_REVIEW_SNAPSHOT',
      source:{...bank.provenance,mode:state.axis==='d1'?'RECORDED_ARCHIVE':'SYNTHETIC_ARCHIVE',sceneId:scene.id,recordId:scene.record,segment:scene.seg,runId:null,checkpointHash:null,lead:null,noiseSeed:null,annotations:null},
      context:{...state,playing:false,selection:{first:s.first,lastExclusive:s.last,startSeconds:s.start,lengthSeconds:s.length,timeOrigin:'stored-array start',fs:bank.fs}},
      scope:{currentWorkspace:state.workspace,currentViewSource:state.workspace==='evidence'?'results/d1/report/table_main.csv':state.workspace==='acquisition'?'NO_DEVICE_SESSION':'demo/demo_bank.js',waveform:'EXP-G stored central 10 s; retained laboratory context',localMetrics:'DC-removed quantized arrays; whole laboratory 10 s, not current acquisition',aggregatePanel:'EXP-A D1 L1 record-level summary; separate experiment'},
      localMetrics:m,notes:$('review-note').value,uiEvents:reviewEvents.slice(-15),notVerified:['archive regeneration','actual AFE connection','clinical morphology preservation','browser pixel QA']};
  }
  const serializeSnapshot=()=>JSON.stringify(snapshot(),(key,value)=>typeof value==='number'&&!Number.isFinite(value)?String(value):value,2);
  function openExport(){if(!dataReady)return;setPlaying(false);$('export-preview').textContent=serializeSnapshot();$('export-dialog').showModal();}
  function downloadSnapshot(){
    const content=serializeSnapshot();
    const blob=new Blob([content],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='ecg-review-'+scene.id+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('검토 snapshot의 내려받기를 요청했습니다.');
  }
  function openDiagnostics(){
    const rows=[['PORT','미연결','장치·포트·baud를 실제 adapter에서 확인'],['FRAME','미확인','source/session ID와 i·n·fs 검사'],['DECODE','미확인','배열 길이·유효 값·ok mask 검사'],['BUFFER','미확인','순서·유실·중복·FE reset 경계 검사'],['RENDER','미확인','정렬된 유효 구간만 표시; invalid span은 gap']];
    $('diagnostics-content').innerHTML=rows.map(r=>`<div class="diagnostic-row"><strong>${r[0]}</strong><span>${r[1]}</span><span>${r[2]}</span></div>`).join('');
    $('diagnostics').showModal();
  }
  function applyRecipe(id){
    const recipe={mixed:{noise:'mixed',snr:0,method:'M08',comparison:'M04'},pli:{noise:'pli',snr:20,method:'M06',comparison:'M04'},loss:{noise:'mixed',snr:20,method:'M06L6',comparison:'M06'}}[id];
    if(!recipe)return;Object.assign(state,recipe,{axis:'d1'});$('axis').value='d1';$('noise').value=state.noise;$('comparison').value=state.comparison;
    if(state.method==='M06L6')document.querySelector('.more-methods').open=true;
    changeScene();
  }
  function boot(){
    $('snr-options').innerHTML=[-5,0,5,10,15,20,25].map(v=>`<button data-snr="${v}" aria-label="주입 SNR ${v} dB" aria-pressed="${v===10}">${v<0?'−5':v}</button>`).join('');
    const primary=['M00','M_FE','M01','M04','M05','M06','M08'];
    const methodButton=([id,m])=>`<button class="method-card" data-method="${id}" aria-pressed="${id===state.method}"><span class="method-id">${id}</span><span><strong>${m.name}</strong><small>${m.family}</small></span></button>`;
    $('method-list').innerHTML=primary.map(id=>methodButton([id,methods[id]])).join('');
    $('more-method-list').innerHTML=Object.entries(methods).filter(([id])=>!primary.includes(id)).map(methodButton).join('');
    $('comparison').innerHTML='<option value="none">추가 비교 없음</option>'+Object.entries(methods).filter(([id])=>id!=='M_FE').map(([id,m])=>`<option value="${id}" ${id===state.comparison?'selected':''}>${id} · ${m.name}</option>`).join('');
    $('comparison').addEventListener('change',()=>{state.comparison=$('comparison').value;if(dataReady){renderGraph();renderMetrics();announce('비교 방법 '+state.comparison+' · 같은 입력과 시간 유지');}});
    $('snr-slider').addEventListener('input',()=>{state.snr=+$('snr-slider').value;changeScene();});
    document.querySelectorAll('[data-recipe]').forEach(b=>b.addEventListener('click',()=>applyRecipe(b.dataset.recipe)));
    document.querySelectorAll('[data-snr]').forEach(b=>b.addEventListener('click',()=>{state.snr=+b.dataset.snr;changeScene();}));
    document.querySelectorAll('[data-method]').forEach(b=>{
      b.addEventListener('click',()=>{state.method=b.dataset.method;preview=null;renderAll();announce(state.method+' 선택 · 입력과 구간 유지');});
      const enter=()=>{preview=b.dataset.method;renderMethodDetail();if(traces)renderGraph();};
      const leave=()=>{preview=null;renderMethodDetail();if(traces)renderGraph();};
      b.addEventListener('mouseenter',enter);b.addEventListener('focus',enter);b.addEventListener('mouseleave',leave);b.addEventListener('blur',leave);
    });
    document.querySelectorAll('[data-workspace]').forEach(b=>b.addEventListener('click',()=>showWorkspace(b.dataset.workspace)));
    document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();showWorkspace('lab');});
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;renderFocus();}));
    $('axis').addEventListener('change',()=>{state.axis=$('axis').value;changeScene();});
    $('noise').addEventListener('change',()=>{state.noise=$('noise').value;changeScene();});
    $('amplitude').addEventListener('change',()=>{state.amplitude=+$('amplitude').value;renderGraph();renderFocus();});
    $('fit').addEventListener('click',()=>{
      let peak=Math.max(...['input','M_FE','clean',state.method,state.comparison].filter(k=>traces[k]).map(k=>traces[k].reduce((m,v)=>Math.max(m,Math.abs(v)),0)));
      if(state.view==='residual'&&traces[state.method])peak=Math.max(peak,traces.input.reduce((m,v,i)=>Math.max(m,Math.abs(v-traces[state.method][i])),0));
      state.amplitude=Math.max(1,Math.ceil(peak*1.05));
      if(!Array.from($('amplitude').options).some(o=>+o.value===state.amplitude))$('amplitude').add(new Option(state.amplitude,state.amplitude));
      $('amplitude').value=state.amplitude;renderGraph();renderFocus();announce('모든 파형의 공통 진폭을 ±'+state.amplitude+' mV로 맞췄습니다.');
    });
    $('play').addEventListener('click',()=>setPlaying(!state.playing));
    $('start').addEventListener('change',()=>moveSelection(+$('start').value));
    $('duration').addEventListener('change',()=>{state.length=+$('duration').value;moveSelection(state.start);});
    $('previous').addEventListener('click',()=>moveSelection(state.start-.5));$('next').addEventListener('click',()=>moveSelection(state.start+.5));
    $('waveform').addEventListener('click',e=>{const r=$('waveform').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*960;moveSelection((x-94)/844*10-state.length/2);});
    $('waveform').addEventListener('mousemove',e=>{if(!traces)return;const r=$('waveform').getBoundingClientRect(),t=Math.max(0,Math.min(9.996,((e.clientX-r.left)/r.width*960-94)/844*10)),i=Math.round(t*bank.fs);$('plot-hint').textContent=`${number(i/bank.fs,3)} s · 입력 ${number(traces.input[i],3)} mV · ${state.method} ${number(traces[state.method]?.[i],3)} mV`;const line=document.querySelector('[data-hover-cursor]');if(line){const x=94+i/bank.n*844;line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('opacity','.8');}});
    $('waveform').addEventListener('mouseleave',()=>{$('plot-hint').textContent='파형을 클릭하면 해당 구간을 확대합니다.';document.querySelector('[data-hover-cursor]')?.setAttribute('opacity','0');});
    $('presentation').addEventListener('click',()=>{state.presentation=!state.presentation;document.body.classList.toggle('presentation-mode',state.presentation);$('presentation').textContent=state.presentation?'분석 보기로 복귀 ↙':'발표 보기 ↗';$('presentation').setAttribute('aria-pressed',String(state.presentation));});
    $('acquisition-scenario').addEventListener('change',renderAcquisition);
    $('provenance-open').addEventListener('click',openProvenance);
    $('provenance-close').addEventListener('click',()=>$('provenance').close());
    $('provenance').addEventListener('close',()=>$('provenance-open').focus());
    $('export-open').addEventListener('click',openExport);$('export-download').addEventListener('click',downloadSnapshot);
    $('review-note').addEventListener('input',()=>{if(dataReady)$('export-preview').textContent=serializeSnapshot();});
    $('diagnostics-open').addEventListener('click',openDiagnostics);
    $('replay-open').addEventListener('click',()=>{$('replay-area').hidden=!$('replay-area').hidden;$('replay-open').textContent=$('replay-area').hidden?'저장 파형 표시':'저장 파형 닫기';setPlaying(false);if(!$('replay-area').hidden)renderReplay();});
    $('replay-play').addEventListener('click',()=>setPlaying(!state.playing));
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
    $('export-dialog').addEventListener('close',()=>$('export-open').focus());$('diagnostics').addEventListener('close',()=>$('diagnostics-open').focus());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});
    document.querySelectorAll('[data-component]').forEach(el=>el.removeAttribute('data-component'));
    const componentSelectors={
      'G-01':'#workspace-nav','G-02':'#provenance-open','G-03':'#export-open','G-04':'#data-error',
      'LAB-01':'#axis','LAB-02':'#noise','LAB-03':'.snr-control','LAB-04':'.source-note','LAB-05':'.signal-column .signal-panel','LAB-06':'#comparison','LAB-07':'#waveform','LAB-08':'.selection-controls','LAB-09':'#amplitude','LAB-10':'#play','LAB-11':'.method-panel','LAB-12':'#method-detail','LAB-13':'.metrics-strip','LAB-14':'#detail-waveform','LAB-15':'.focus-reading','LAB-16':'#presentation','LAB-17':'.guided-tour','LAB-18':'#contribution','LAB-19':'.scene-evidence','LAB-20':'.annotation-contract',
      'EVD-01':'#evidence .page-heading','EVD-02':'#evidence-bars','EVD-03':'#evidence-table','EVD-04':'#evidence .notice','EVD-05':'.reading-panel',
      'ACQ-01':'.acquisition-empty','ACQ-02':'#acquisition-scenario','ACQ-03':'.device-stats','ACQ-04':'#diagnostics-open','ACQ-05':'#diagnostics','ACQ-06':'.replay-preview',
      'OPS-01':'#export-dialog','OPS-02':'#provenance','OPS-03':'#status'};
    for(const [id,selector] of Object.entries(componentSelectors))document.querySelector(selector)?.setAttribute('data-component',id);
    renderAll();renderAcquisition();
  }
  boot();
})();
