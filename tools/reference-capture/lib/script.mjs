// Input scripts (D-017 shooting order as code). The same script runs on a virtual clock (layer A) and in real time (layer B),
// against a reference site and against our app, so the inputs are identical. A script is an async function over a context:
//   c.stage(name)  start a named segment      c.wait(ms)   let time pass (frames in A, sleep in B)
//   c.wheel(dy)    send one wheel notch       c.progress() page scroll progress 0–1, c.resolve(v) number|selector → progress
export const SCRIPT_NAMES = ['standard', 'transition'];
const FRAME = 1000 / 60;

export const SCRIPTS = {
  // D-017 order: idle → 3 single notches → continuous → idle → one fast flick → idle → small reverse
  async standard(c) {
    await c.stage('1-idle');await c.wait(2000);
    await c.stage('2-notches');for (let i = 0; i < 3; i++) {await c.wheel(100);await c.wait(700);}
    await c.stage('3-continuous');for (let i = 0; i < 20; i++) {await c.wheel(100);await c.wait(100);}
    await c.stage('4-idle');await c.wait(2000);
    await c.stage('5-fast');for (let i = 0; i < 15; i++) {await c.wheel(80);await c.wait(FRAME);}   // 15 × 80 = 1200 in 0.25 s
    await c.stage('6-idle');await c.wait(1500);
    await c.stage('7-back');await c.wheel(-300);await c.wait(1500);
  },
  // Move quickly to --from, then pass --from → --to one notch (100) per 0.5 s so the transition's middle states land on many frames.
  async transition(c, o = {}) {
    const from = o.from ?? 0, to = o.to ?? 1, maxNotches = o.maxNotches ?? 80;
    const target = async (v) => c.resolve(v);
    const fromP = await target(from), toP = await target(to);
    await c.stage('0-approach');
    for (let i = 0; i < 400 && (await c.progress()) < fromP - 0.004; i++) {await c.wheel(200);await c.wait(50);}
    await c.wait(1000);
    let notch = 0, chunk = 0;
    while ((await c.progress()) < toP && notch < maxNotches) {
      await c.stage(`pass-${String(++chunk).padStart(2, '0')}`);
      for (let k = 0; k < 5 && (await c.progress()) < toP && notch < maxNotches; k++, notch++) {await c.wheel(100);await c.wait(500);}   // 2.5 s per segment (< 180 frames)
    }
    await c.stage('end-idle');await c.wait(1500);
  },
};

/** Wrap an executor's raw functions with input logging so input.json is the same shape in both layers. */
export function makeContext(exec, log) {
  let stage = '';
  return {
    async stage(name) {stage = name;log.stages.push({name, atMs: exec.now()});await exec.onStage?.(name);},
    async wait(ms) {await exec.wait(ms);},
    async wheel(dy) {log.events.push({atMs: exec.now(), stage, type: 'wheel', deltaY: dy});await exec.wheel(dy);},
    progress: () => exec.progress(),
    resolve: (v) => exec.resolve(v),
  };
}
