// R1 story copy (Korean) — AUTOPILOT_DECISIONS.md AP-14. Scope wording follows packet §1.1-5.
export const NOISE_KO:Record<string,string>={pli:'전원 간섭',bw_synth:'기저선 변동',ma_synth:'근육 잡음',em_synth:'전극 움직임',awgn:'백색 잡음',impulse:'임펄스',mixed:'혼합 잡음'};
export const COPY={
 attractTitle:'잡음 속 심전도 신호',
 attractSub:(snr:number,method:string)=>`저장 신호 재생 · 합성 기록 S038 · 전원 간섭 ${snr} dB · 출력 ${method}`,
 attractCta:'스크롤 또는 클릭: 시작',
 notice:'저장 신호 재생',
 storyHeader:(record:string,snr:number)=>`합성 ECG · 기록 D0 ${record} · ${snr} dB · 저장된 10초 구간`,
 storyTitle:'잡음 유형별 최고 성능 기법',
 conclusion:'이 저장 구간에서 잡음 유형마다 최고 성능 기법이 다르다.',
 gridTitle:'49개 장면의 기법별 순위',
 gridNote:'D1 실제 기록 · 잡음 종류마다 다른 기록 · 장면마다 저장된 10초 · 칸: 장면별 최고 성능 기법(기준 신호가 필요한 B01 제외)',
 barsTitle:'전체 실험 평균 SNR 개선량',
 barsNote:'EXP-A · D1 · TEST 22 기록 · 혼합 잡음 −5…20 dB · scaled SNR 개선 평균(dB)',
 stripLabel:'입력 − Reference · 표시 확대(눈금 단위 mV)',
 inputLabel:'입력',
 outputLabel:(id:string,name:string)=>`출력 · ${id} ${name}`,
 winnerValue:(v:string)=>`SNR 개선 ${v} dB`,
 oracle:'B01 · 기준 신호 필요(오라클)',
 notInExpA:'EXP-A에 없음 · 보조 실험 EXP-G',
 notInBank:'전시 장면 자료에 출력 미포함',
 ctaNext:'다음 잡음 →',ctaWider:'전체 장면 →',ctaLab:'실험실에서 비교 →',skipLab:'실험실로 이동',
 legendRef:(axis:string)=>axis==='d0'?'Reference(합성 기준 신호)':'Reference(원기록 · 공통 전처리)',
};
// Stored values keep their stored precision (AP-15, G-10): two decimals.
export const dB=(v:number)=>v.toFixed(2);
