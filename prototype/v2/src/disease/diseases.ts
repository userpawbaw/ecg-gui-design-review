/* D-189 심질환 파형 탭 — 질환 목록 · 정상과 비교한 특징(짧게). 문장은 이 프로젝트가 쓴 교육용 요약(교과서 수준 사실만, 진단 기준 아님).
 * 파형 자료: MIT-BIH 부정맥 DB 시험(DS2) 기록, 전문의 박동 · 리듬 주석으로 구간 선택(scripts/disease/build_disease_bank.py).
 * mark: 이 구간에서 위치를 알려 줄 박동 기호(주석). MLII 한 유도만 보이므로 12유도에서만 보이는 특징은 쓰지 않는다. */
export type Disease = {id: string, name: string, group: string, short: string, vsNormal: string[], watch: string, mark?: {sym: string, label: string}, span?: {r: string, label: string}};
export const DISEASES: Disease[] = [
  {id: 'normal', name: '정상 동리듬', group: '기준', short: '비교 기준 — 규칙적, P–QRS–T 순서',
    vsNormal: ['박동마다 앞에 P파가 하나', 'PR 간격 0.12–0.20 s · QRS 폭 0.12 s 미만(좁음)', 'R–R 간격이 규칙적, 60–100 bpm'],
    watch: '다른 질환과 견줄 기준입니다. 처리 뒤에도 P파 · T파의 작은 굴곡이 남는지 보세요.'},
  {id: 'sbr', name: '동서맥 · 긴 휴지', group: '정상 리듬 변이', short: '모양은 정상, 간격만 길다(60 bpm 미만)',
    vsNormal: ['P–QRS–T 순서는 정상과 같음', 'R–R 간격이 길어 60 bpm 미만', '이 기록(232)은 수 초의 긴 휴지가 섞인 동기능 부전 양상(주석상 심방 조기 박동 · 우각 차단 박동 포함)'],
    watch: '박동 사이 평평한 구간이 깁니다. 잡음이 그 빈 구간에 가짜 박동처럼 남지 않는지 보세요.'},
  {id: 'apc', name: '심방 조기 수축', group: '심방 부정맥', short: '일찍 오는 박동 · QRS는 좁고 정상 모양', mark: {sym: 'A', label: '심방 조기 박동'},
    vsNormal: ['예상보다 일찍 오는 박동', '그 앞 P파 모양이 다르거나 앞 T파에 묻힘', 'QRS는 좁고 정상 박동과 비슷'],
    watch: '조기 박동 앞의 작은 P파가 처리 뒤에 남는지 보세요.'},
  {id: 'afib', name: '심방세동', group: '심방 부정맥', short: 'P파 없음 · R–R 완전 불규칙',
    vsNormal: ['P파가 없고 기저선이 잔물결처럼 떨림(f파)', 'R–R 간격이 규칙 없이 제각각', 'QRS는 좁음'],
    watch: '잔물결(f파)은 잡음과 비슷해 처리가 함께 지울 수 있습니다. 불규칙한 R–R 간격은 처리 뒤에도 그대로여야 합니다.'},
  {id: 'afl', name: '심방 조동', group: '심방 부정맥', short: 'P 대신 톱니 모양 F파',
    vsNormal: ['P파 자리에 톱니 모양 F파가 빠르게(약 300회/분) 반복', '심실은 그중 일부만 전도(2:1–4:1)', 'QRS는 좁음'],
    watch: '톱니 모양 F파가 처리 뒤에도 보이는지, 매끈한 기저선으로 바뀌지 않는지 보세요.'},
  {id: 'pvc', name: '심실 조기 수축', group: '심실 부정맥', short: '일찍 오는 넓고 기이한 QRS', mark: {sym: 'V', label: '심실 조기 박동'},
    vsNormal: ['예상보다 일찍 오는 넓은 QRS(0.12 s 이상), 모양이 다름', '앞에 P파가 없음', 'T파가 QRS와 반대 방향, 뒤에 긴 휴지(보상 휴지)'],
    watch: '넓은 박동이 처리 뒤에 정상 모양으로 「고쳐지지」 않는지 보세요(원본 저장소 EXP-E에서 모든 기법이 형태를 보존).'},
  {id: 'bigeminy', name: '심실 이단맥', group: '심실 부정맥', short: '정상 · 넓은 박동이 번갈아', mark: {sym: 'V', label: '심실 조기 박동'},
    vsNormal: ['정상 박동 하나, 심실 조기 박동 하나가 짝지어 반복', '짧은 간격 · 긴 간격이 번갈아'],
    watch: '두 모양의 박동이 처리 뒤에도 서로 다르게 남는지 보세요.'},
  {id: 'vt', name: '심실 빈맥(짧은 연발)', group: '심실 부정맥', short: '넓은 QRS가 3개 이상 빠르게 연속', mark: {sym: 'V', label: '심실 박동'}, span: {r: '(VT', label: '심실 빈맥 구간'},
    vsNormal: ['넓은 QRS가 3개 이상 연달아 빠르게(100 bpm 넘게)', 'P파와 QRS의 관계가 끊김', '지속되면 응급(이 구간은 짧은 연발)'],
    watch: '연발 구간의 넓은 박동이 뭉개지거나 잡음으로 지워지지 않는지 보세요.'},
  {id: 'lbbb', name: '좌각 차단', group: '전도 차단', short: '넓고 끝이 갈라진 QRS', 
    vsNormal: ['QRS가 넓음(0.12 s 이상)', '이 유도(MLII)에서 넓고 꼭대기가 갈라지거나 뭉툭한 R파', 'T파가 QRS와 반대 방향 · 리듬은 규칙'],
    watch: 'QRS 꼭대기의 작은 홈(갈라짐)이 처리 뒤에도 남는지 보세요.'},
  {id: 'rbbb', name: '우각 차단', group: '전도 차단', short: '넓은 QRS · 끝부분이 느리게 끌림',
    vsNormal: ['QRS가 넓음(0.12 s 이상)', 'QRS 끝부분이 넓게 끌림(우심실이 늦게 탈분극)', '리듬은 규칙 · 대표 모양(V1의 rSR′)은 이 유도에서 안 보임'],
    watch: 'QRS 끝의 끌리는 부분이 처리 뒤에 좁아지지 않는지 보세요.'},
  {id: 'avb2', name: '2도 방실 차단', group: '전도 차단', short: 'P파 뒤 QRS가 빠짐',
    vsNormal: ['P파는 규칙적으로 오는데 일부 뒤에 QRS가 없음', '빠진 자리의 R–R가 두 배 가까이 김', '이 기록(231)은 2:1 전도 구간 · 우각 차단이 함께 있어 QRS가 넓음'],
    watch: 'QRS가 빠진 자리의 홀로 선 P파가 처리 뒤에도 보이는지 보세요.'},
];
/** 주석 박동 위치(초, 이 10 s 안). */
export const markTimes = (beats: {i: number, s: string}[], sym: string, fs: number) => beats.filter(b => b.s === sym).map(b => b.i / fs);
/** 주석 리듬 구간(초, 이 10 s 안). */
export const spanTimes = (rhythm: {r: string, a: number, b: number}[], r: string, fs: number) => rhythm.filter(x => x.r === r).map(x => [x.a / fs, x.b / fs] as [number, number]);
