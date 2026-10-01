// Input scripts (D-017 shooting order as code). The same script runs on a virtual clock (layer A) and in real time (layer B),
// against a reference site and against our app, so the inputs are identical. A script is an async function over a context:
//   c.stage(name)  start a named segment      c.wait(ms)   let time pass (frames in A, sleep in B)
//   c.wheel(dy)    send one wheel notch       c.progress() page scroll progress 0–1, c.resolve(v) number|selector → progress
//   c.move(x, y)   move the pointer (hover)   c.targets(spec, n) hover candidates on screen, c.viewport(), c.note(key, value) → input.json
//   c.still(name)  save a full-resolution still of the settled screen (survey; fast mode only)
export const SCRIPT_NAMES = ['standard', 'transition', 'hover', 'survey', 'drag'];

// drag stage (ms from the press): glide while pressed, hold, release; then the picture is watched for inertia after the release.
export const DRAG_TIMING = {glide: 600, hold: 300, after: 1800};

// Survey timing (ms): travel = NOTCH-sized wheel notches every NOTCH_GAP ms; then the screen is left alone for DWELL before the still.
export const SURVEY_TIMING = {notch: 100, notchGap: 50, dwell: 2000};
const FRAME = 1000 / 60;

// timings of one hover stage (ms): glide in, dwell on the element, glide out, settle. Analysis (hoverMetrics) relies on them.
export const HOVER_TIMING = {glideIn: 400, dwell: 1200, glideOut: 400, settle: 500};

/** Pointer glide from (x0,y0) to (x1,y1) over ms: one move per frame, smoothstep easing (so velocity is human-like, not a teleport). */
async function glide(c, x0, y0, x1, y1, ms) {
  const n = Math.max(1, Math.round(ms / FRAME));
  for (let k = 1; k <= n; k++) {
    const u = k / n, e = u * u * (3 - 2 * u);
    await c.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e);
    await c.wait(FRAME);
  }
}

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
  // Drag study — only ever run on a site whose scripts/listeners show drag evidence (lib/evidence.mjs). Press on the biggest canvas, move, release.
  async drag(c, o = {}) {
    if (o.enter) {const r = await c.enter();c.note('enter', r);await c.wait(3000);}
    const t = await c.dragTarget();
    if (!t) {c.note('dragSkipped', 'no canvas or grab-cursor element in view');return;}
    const {w, h} = await c.viewport(), D = DRAG_TIMING, span = Math.round(Math.min(t.w, w) * 0.25), spanY = Math.round(Math.min(t.h, h) * 0.25);
    c.note('dragTarget', t);
    await c.stage('g0-idle');await c.move(t.x, t.y);await c.wait(1000);
    for (const [name, dx, dy] of [['g1-drag-x', span, 0], ['g2-drag-y', 0, spanY]]) {
      await c.stage(name);
      c.note('stageTarget', {stage: name, label: 'drag ' + (dx ? 'horizontal ' + dx : 'vertical ' + dy) + ' px', tag: t.kind, l: t.x - t.w / 2, t: t.y - t.h / 2, w: t.w, h: t.h});
      await c.move(t.x, t.y);await c.down();
      await glide(c, t.x, t.y, t.x + dx, t.y + dy, D.glide);
      await c.wait(D.hold);await c.up();await c.wait(D.after);
      await c.move(t.x, t.y);await c.wait(400);
    }
  },
  // Position survey (AI-driven, not the human D-017 order): walk down the page in equal wheel distances, let each stop settle, take a still;
  // then walk back up the same stops. Tells apart — per stop — what is a function of scroll position (scrub) vs of history (triggered once),
  // how long effects take to settle after the input stops (lag), how much ambient motion runs while idle, and where the big transitions are.
  // --stops N (default 36)  --stop-px P (default: spread over the page, 0.5–4 screens).
  async survey(c, o = {}) {
    if (o.enter) {const r = await c.enter();c.note('enter', r);await c.wait(3000);}
    const {h} = await c.viewport(), T = SURVEY_TIMING, stops = o.stops ?? 36, range = await c.range();
    // spacing: half a screen on short pages; long pages are spread over the stops (≤ 4 screens apart); pages with no measurable scroll range use half a screen
    const px = o.stopPx ?? (Number.isFinite(range) && range > 0 ? Math.min(h * 4, Math.max(h * 0.5, range / stops)) : h * 0.5), per = Math.max(1, Math.round(px / T.notch));
    c.note('survey', {stops, px: per * T.notch, range});
    const pad = (i) => String(i).padStart(2, '0');
    let closed = Number.isFinite(range) && range > 0;const downP = [];
    // down: fixed wheel distance per stop. up (scrollable pages): closed loop back to the progress each down stop had, so forward/back stills are
    // taken at the same position (a clamped page end or scroll-jacking would otherwise shift every up stop).
    const legDown = async (name, i) => {
      await c.stage(name);
      for (let k = 0; k < per; k++) {await c.wheel(T.notch);await c.wait(T.notchGap);}
      c.note('travelEndMs', {stage: name, ms: per * T.notchGap});
      await c.wait(T.dwell);await c.still(name);
      const p = await c.progress();downP[i] = p;
      c.note('stop', {stage: name, dir: 'down', i, px: i * per * T.notch, progress: p});
    };
    const legUp = async (name, i) => {
      await c.stage(name);
      let travelMs = 0;
      if (closed) {
        for (let k = 0; k < 10; k++) {
          const e = ((await c.progress()) - downP[i]) * range;   // px still to go (negative = too far up)
          if (!Number.isFinite(e) || Math.abs(e) <= 12) break;
          await c.wheel(-Math.sign(e) * Math.min(Math.abs(e), 400));await c.wait(450);travelMs += 450;
        }
      } else {
        for (let k = 0; k < per; k++) {await c.wheel(-T.notch);await c.wait(T.notchGap);}
        travelMs = per * T.notchGap;
      }
      c.note('travelEndMs', {stage: name, ms: travelMs});
      await c.wait(T.dwell);await c.still(name);
      c.note('stop', {stage: name, dir: 'up', i, px: i * per * T.notch, progress: await c.progress()});
    };
    await c.stage('s00');await c.wait(1500);await c.still('s00');
    downP[0] = await c.progress();c.note('stop', {stage: 's00', dir: 'top', i: 0, px: 0, progress: downP[0]});
    let last = downP[0], stale = 0, reached = 0, escapes = 0, everMoved = false;
    for (let i = 1; i <= stops; i++) {
      await legDown('d' + pad(i), i);reached = i;
      const p = downP[i];   // end of page: the position stops advancing (only measurable on scrollable pages)
      if (Number.isFinite(p) && Math.abs(p - downP[0]) > 0.002) everMoved = true;
      // progress that never leaves its start value is not a position (virtual scroll over a fixed page): then neither end detection nor closed-loop return apply
      if (Number.isFinite(p) && everMoved) {
        if (p >= 0.995) break;
        if (p - last < 0.002) stale++;else stale = 0;
        // not at the end but not moving: often a modal/overlay locks the scroll — try Escape (keyboard only, no clicks) a couple of times before giving up
        if (stale >= 2 && escapes < 2 && c.key) {escapes++;stale = 0;await c.key('Escape');await c.wait(800);c.note('escape', {stage: 'd' + pad(i), progress: p});continue;}
        if (stale >= 2) break;
        last = p;
      }
    }
    if (!everMoved) closed = false;
    for (let i = reached - 1; i >= 0; i--) await legUp('u' + pad(i), i);
  },
  // Hover study (no clicks): pointer sweeps across the screen (pointer-follow / parallax effects), then glides onto each target, dwells, and leaves.
  // --hover auto | "sel,sel"  --hover-count N (default 4)  --from <progress> scrolls there first (e.g. a footer with links).
  async hover(c, o = {}) {
    const {w, h} = await c.viewport(), home = [w * 0.5, h * 0.5];
    if (o.from !== undefined) {
      const fromP = await c.resolve(o.from);
      await c.stage('0-approach');
      for (let i = 0; i < 400 && (await c.progress()) < fromP - 0.004; i++) {await c.wheel(200);await c.wait(50);}
      await c.wait(1000);
    }
    if (o.enter) {const r = await c.enter();c.note('enter', r);await c.wait(3000);}
    if (c.key) await c.key('Escape');   // close a promo/consent overlay if one is up (keyboard only, no clicks)
    await c.stage('h0-idle');await c.move(...home);await c.wait(1000);
    await c.stage('h1-sweep');
    await glide(c, w * 0.1, h * 0.5, w * 0.9, h * 0.5, 1200);
    await glide(c, w * 0.5, h * 0.12, w * 0.5, h * 0.88, 1200);
    await c.move(...home);await c.wait(500);
    const list = await c.targets(o.hover ?? 'auto', o.count ?? 4);
    c.note('hoverTargets', list);
    let [px, py] = home;
    const away = [w - 4, h - 4], T = HOVER_TIMING;
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      await c.stage(`hover-${String(i + 1).padStart(2, '0')}`);
      if (c.key) await c.key('Escape');   // timed promo modals (e.g. Superpower) would otherwise swallow the hover
      c.note('stageTarget', {stage: `hover-${String(i + 1).padStart(2, '0')}`, ...t});
      await glide(c, px, py, t.x, t.y, T.glideIn);
      await c.wait(T.dwell);
      await glide(c, t.x, t.y, away[0], away[1], T.glideOut);
      await c.wait(T.settle);
      [px, py] = away;
    }
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
    range: async () => (exec.range ? exec.range() : NaN),
    key: exec.key ? async (k) => exec.key(k) : undefined,
    resolve: (v) => exec.resolve(v),
    async move(x, y) {await exec.move(x, y);},
    targets: (spec, n) => exec.targets(spec, n),
    viewport: () => exec.viewport(),
    async down() {await exec.down();},
    async up() {await exec.up();},
    dragTarget: () => exec.dragTarget(),
    async enter() {return exec.enter ? exec.enter() : {clicked: false, reason: 'not supported in this mode'};},
    async still(name) {if (!exec.still) throw new Error('--script survey 는 --mode fast 에서만 실행됨');await exec.still(name);},
    note(key, value) {(log.notes ||= []).push({key, atMs: exec.now(), value});},
  };
}
