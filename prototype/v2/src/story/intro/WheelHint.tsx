// D-163 파형 단계 휠 안내. 나타남 · 사라짐(불투명도)과 애니메이션 시작(.run)은 introStage 가 정한다 —
// 파형이 돈 뒤 진행 0.81 ~ 0.95, 입력이 1.2 s 없을 때만. 움직임 줄이기에서는 정지 그림.
//  arrows  — 사용자 안: 휠 위아래 화살표, 아래(→ 출력, 청록) 강조 → 위(→ 입력, 주황) 강조가 한 번씩 지나간다
//  preview — 제안 안: 휠이 아래로 가면 작은 「입력 → 출력」 막대가 주황에서 청록으로 차고, 위로 가면 비워진다
export type WheelHintKind = 'arrows' | 'preview' | 'off';
export const WHEEL_HINT: WheelHintKind = (() => {
  const v = new URLSearchParams(location.search).get('wheelhint');
  return v === 'preview' || v === 'off' ? v : 'arrows';
})();

const Mouse = ({arrows}: {arrows: boolean}) =>
  <svg className="wh-mouse" viewBox="0 0 40 64" width="30" height="48" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect className="wh-body" x="4" y="2" width="32" height="60" rx="16"/>
    <rect className="wh-wheel" x="17" y="21" width="6" height="12" rx="3"/>
    {arrows && <>
      <path className="wh-up" d="M14 15l6-6 6 6"/>
      <path className="wh-dn" d="M14 40l6 6 6-6"/>
    </>}
  </svg>;

export function WheelHint({kind}: {kind: WheelHintKind}) {
  if (kind === 'off') return null;
  return <div className={'it-wheelhint wh-' + kind} aria-hidden="true">
    <Mouse arrows={kind === 'arrows'}/>
    {kind === 'preview' && <div className="wh-bar">
      <span className="wh-in">입력</span><i><b/></i><span className="wh-out">출력</span>
    </div>}
  </div>;
}
