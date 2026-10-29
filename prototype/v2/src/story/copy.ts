// R1 story copy (Korean) — AUTOPILOT_DECISIONS.md AP-14. Scope wording follows packet §1.1-5.
export const NOISE_KO:Record<string,string>={pli:'전원 간섭',bw_synth:'기저선 변동',ma_synth:'근육 잡음',em_synth:'전극 움직임',awgn:'백색 잡음',impulse:'임펄스',mixed:'혼합 잡음'};
export const COPY={
 attractTitle:'잡음 속에서, 신호를',
 attractSub:(snr:number,method:string)=>`저장 재생 · 합성 기록 S038 · 전원 간섭 ${snr} dB · 출력 ${method}`,
 attractCta:'휠을 굴리거나 클릭해 시작',
 notice:'ARCHIVED REPLAY — 실제 장치 세션 없음',
 storyHeader:(record:string,snr:number)=>`같은 합성 ECG · 기록 D0 ${record} · ${snr} dB · 저장된 10초 구간`,
 storyTitle:'잡음이 바뀌면, 1등이 바뀝니다',
 conclusion:'이 저장 구간에서는 잡음마다 가장 잘 맞는 방법이 달랐습니다',
 gridTitle:'49개 장면으로 넓히면',
 gridNote:'D1 실제 기록 · 잡음 종류마다 다른 기록 · 장면마다 저장된 10초 · 칸마다 그 장면의 1등(참조가 필요한 B01 제외)',
 barsTitle:'전체 실험 평균: 차이는 생각보다 좁습니다',
 barsNote:'EXP-A · D1 · TEST 22 기록 · 혼합 잡음 −5…20 dB · scaled SNR 개선 평균(dB)',
 stripLabel:'입력 − Reference · 표시 확대(눈금은 실제 mV)',
 inputLabel:'입력',
 outputLabel:(id:string,name:string)=>`출력 · ${id} ${name}`,
 winnerValue:(v:string)=>`SNR 개선 ${v} dB`,
 oracle:'B01 · 참조가 있어야 쓰는 비교 기준',
 notInExpA:'EXP-A에 없음 · 보조 실험 EXP-G',
 notInBank:'전시 장면 자료에 출력 없음',
 ctaNext:'휠: 다음 잡음 →',ctaWider:'휠: 더 넓게 보기 →',ctaLab:'클릭해 직접 바꿔 보기 →',skipLab:'바로 실험실 →',
 legendRef:(axis:string)=>axis==='d0'?'Reference · 합성 기준 신호':'Reference · 원기록에 공통 FE 적용',
};
// Stored values keep their stored precision (AP-15, G-10): two decimals.
export const dB=(v:number)=>v.toFixed(2);
