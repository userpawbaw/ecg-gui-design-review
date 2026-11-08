// D-161 파형 그리기 비교 스위치(사용자 2026-11-08: 「이전 버전 / 최적화를 실험실 탭에도 / 실시간 탭에만」 세 실행 명령으로 비교).
//  prev — 이전: 실시간 = D-157 그리기, 실험실 = D-073 그리기(매 프레임 전체 래스터화)
//  live — 실시간 탭에만: 실시간 = 실험실 효과 + 링 스트립, 실험실 = D-073 그대로
//  all  — 실험실 탭에도: 두 탭 모두 링 스트립   (기본값 — 사용자 2026-11-08 「모두 최적화 적용 버젼으로」)
//  naive — 측정 전용: 실시간 탭에 같은 효과를 실험실 원래 방식으로(최적화 효과를 재는 기준선). 실행 명령은 없음
export type WaveMode = 'prev' | 'live' | 'all' | 'naive';
export const WAVE: WaveMode = (() => { const v = new URLSearchParams(location.search).get('wave'); return v === 'prev' || v === 'live' || v === 'naive' ? v : 'all'; })();
