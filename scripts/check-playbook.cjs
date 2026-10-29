#!/usr/bin/env node
'use strict';
// Experience playbook checker (docs/playbook/01_FORMAT.md §4): recommendation cards P-*, journeys J-*.
// Catches what is missing (fields, sections, broken chains, unreferenced failures) and what is padded
// (placeholders, untraced generic advice, vague bullets, copied sentences). It cannot judge insight;
// 01_FORMAT.md §4 keeps the human checklist for that.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.env.PLAYBOOK_ROOT || path.join(__dirname, '..'));
const PB = path.join(ROOT, 'docs', 'playbook');
const JDIR = path.join(PB, 'journeys');
const RECORDS = path.join(ROOT, 'docs', 'uiux_system', 'records');
const CASES = path.join(ROOT, 'docs', 'uiux_system', 'cases');
const REFS = path.join(ROOT, 'docs', 'uiux_system', 'references');

const EVIDENCE = ['[캡처]', '[영상]', '[런타임]', '[테스트]', '[코드]', '[커밋]', '[대화]', '[사용자평가]',
  '[플러그인]', '[문헌]', '[추론]', '[재구성]', '[파일]'];
const P_FIELDS = ['상태', '언제 읽나', '도달 수준', '근거 여정', '강제 장치', '갱신'];
const P_REQUIRED = ['권장 방법', '도달한 품질', '틀린 길이라는 신호', '적용 범위와 재검토 조건'];
const P_OPTIONAL = ['가지 말 길', '타협하면 안 되는 지점', '남은 한계'];
const P_TRACED = ['가지 말 길', '틀린 길이라는 신호', '타협하면 안 되는 지점'];
const J_FIELDS = ['기간', '도착', '기록'];
const J_REQUIRED = ['출발점', '흐름 한눈에', '도착점'];
const NODE_FIELDS = ['날짜', '종류', '계기', '가설', '판정', '다음', '기록'];
const VERDICTS = ['채택', '부분 채택', '기각', '타협', '대체됨'];
const KINDS = ['시도', '비교'];
const PLACEHOLDER = /^(?:TODO|TBD|N\/A|-+|없음|미정|추후(?: 작성)?|나중에|…|\.{3})[.!\s]*$/i;
const VAGUE = /적절히|신중히|신중하게|꼼꼼히|충분히|잘 확인|주의 깊게|가능하면/;
const REPO_PATH = /^(?:docs|scripts|verification|prototype|\.claude|assets|tests|tools)\//;

const errors = [];
const fail = m => errors.push(m);
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const list = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => re.test(n)).sort() : []);

// ---- known ids -------------------------------------------------------------------------------
function recordIds() {
  const ids = new Set();
  for (const f of list(RECORDS, /\.md$/)) for (const m of read(path.join(RECORDS, f)).matchAll(/^## ([FDOR]-\d+)\./gm)) ids.add(m[1]);
  for (const f of list(CASES, /^CASE-\d+_.*\.md$/)) ids.add(f.match(/^(CASE-\d+)/)[1]);
  for (const f of list(REFS, /^REF-\d{3}_.*\.md$/)) ids.add(f.slice(0, 7));
  return ids;
}

// ---- parsing ---------------------------------------------------------------------------------
function headerTable(text) {
  const head = text.split(/^## /m)[0];
  const rows = {};
  for (const m of head.matchAll(/^\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|\s*$/gm)) if (m[1].trim()) rows[m[1].trim()] = m[2].trim();
  return rows;
}
function sections(text, level) {
  const mark = '#'.repeat(level) + ' ';
  const re = new RegExp(`^${mark}(.+)$`, 'gm');
  const hs = [...text.matchAll(re)];
  return hs.map((h, i) => ({ name: h[1].trim(), body: text.slice(h.index + h[0].length, i + 1 < hs.length ? hs[i + 1].index : text.length) }));
}
function tableRows(body) {
  const rows = {};
  for (const m of body.matchAll(/^\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|\s*$/gm)) if (m[1].trim()) rows[m[1].trim()] = m[2].trim();
  return rows;
}
const plain = s => s.replace(/[*_`>#|]/g, '').replace(/\s+/g, ' ').trim();
const bullets = body => body.split('\n').filter(l => /^\s*(?:[-*]|\d+\.)\s+/.test(l)).map(l => l.replace(/^\s*(?:[-*]|\d+\.)\s+/, ''));
const backticks = s => [...s.matchAll(/`([^`]+)`/g)].map(m => m[1].trim());

// "J-001 T6, T10–T12; J-002 T3" -> [['J-001',6],['J-001',10],...]
function nodeRefs(s) {
  const out = [];
  for (const part of s.split(/(?=J-\d{3})/)) {
    const j = (part.match(/^J-\d{3}/) || [])[0];
    if (!j) continue;
    for (const m of part.slice(5).matchAll(/T(\d+)(?:\s*[–-]\s*T(\d+))?/g)) {
      const a = +m[1], b = m[2] ? +m[2] : a;
      for (let t = a; t <= b; t++) out.push([j, t]);
    }
  }
  return out;
}

// ---- shared checks ---------------------------------------------------------------------------
function checkPaths(where, s) {
  for (const p of backticks(s)) {
    const clean = p.replace(/[:#].*$/, '').replace(/\s.*$/, '');
    if (!REPO_PATH.test(clean) || /[*<>{}]/.test(clean)) continue;
    if (!fs.existsSync(path.join(ROOT, clean))) fail(`${where}: 없는 경로 \`${clean}\``);
  }
}
function checkIds(where, s, known, cards, journeys) {
  for (const m of s.matchAll(/\b((?:[FDOR]|CASE|REF)-\d+)\b/g)) if (!known.has(m[1])) fail(`${where}: 없는 기록 ${m[1]}`);
  for (const m of s.matchAll(/\bP-\d{3}\b/g)) if (!cards.has(m[0])) fail(`${where}: 없는 카드 ${m[0]}`);
  for (const m of s.matchAll(/\bJ-\d{3}\b/g)) if (!journeys.has(m[0])) fail(`${where}: 없는 여정 ${m[0]}`);
}
function checkFilled(where, body) {
  const t = plain(body);
  if (!t) return fail(`${where}: 비어 있다`);
  if (PLACEHOLDER.test(t)) return fail(`${where}: placeholder만 있다 ("${t}")`);
  if (/^해당 없음/.test(t) && !/^해당 없음 — .{8,}/.test(t)) fail(`${where}: '해당 없음'에는 '— 8자 이상 사유'가 필요하다`);
}
function checkVague(where, body) {
  for (const b of bullets(body)) {
    if (VAGUE.test(b) && !/\d|`|[A-Z]+-\d+/.test(b)) fail(`${where}: 막연한 항목 (수치·경로·ID 없이 '${b.match(VAGUE)[0]}') — "${b.slice(0, 40)}"`);
  }
}
const isNA = body => /^해당 없음 — /.test(plain(body));
const norm = s => s.replace(/\(J-\d{3}[^)]*\)/g, '').replace(/[\s*_`>#|.,:;—–-]/g, '');

// ---- main ------------------------------------------------------------------------------------
function main() {
  if (!fs.existsSync(PB)) { fail('docs/playbook 폴더가 없다'); return report(0, 0); }
  const known = recordIds();
  const pFiles = list(PB, /^P-\d{3}_.*\.md$/);
  const jFiles = list(JDIR, /^J-\d{3}_.*\.md$/);
  const cards = new Map(), journeys = new Map();

  for (const f of jFiles) {
    const id = f.slice(0, 5), text = read(path.join(JDIR, f));
    if (journeys.has(id)) fail(`중복 여정 ID ${id}`);
    const nodes = new Map();
    for (const s of sections(text, 2)) {
      const m = s.name.match(/^T(\d+)\.\s+\S/);
      if (!m) continue;
      if (nodes.has(+m[1])) fail(`${id}: 중복 노드 T${m[1]}`);
      nodes.set(+m[1], { n: +m[1], name: s.name, body: s.body, rows: tableRows(s.body.split(/^### /m)[0]), subs: sections(s.body, 3) });
    }
    journeys.set(id, { id, file: f, text, head: headerTable(text), secs: sections(text, 2), nodes });
  }
  for (const f of pFiles) {
    const id = f.slice(0, 5), text = read(path.join(PB, f));
    if (cards.has(id)) fail(`중복 카드 ID ${id}`);
    if (!new RegExp(`^# ${id}\\. \\S`, 'm').test(text)) fail(`${id}: 제목은 '# ${id}. <작업 상황> — <권장>' 형식`);
    cards.set(id, { id, file: f, text, head: headerTable(text), secs: sections(text, 2) });
  }

  // ---- journeys
  for (const J of journeys.values()) {
    const w = J.id;
    for (const k of J_FIELDS) if (!J.head[k] || PLACEHOLDER.test(plain(J.head[k]))) fail(`${w}: 머리표 '${k}' 누락/빈칸`);
    const names = J.secs.map(s => s.name);
    for (const r of J_REQUIRED) {
      const s = J.secs.find(x => x.name === r);
      if (!s) fail(`${w}: 필수 절 누락 (## ${r})`); else checkFilled(`${w} ${r}`, s.body);
    }
    if (!J.nodes.size) fail(`${w}: 노드(## T1. …)가 없다`);
    checkIds(`${w} 머리표`, `${J.head['도착'] || ''} ${J.head['기록'] || ''}`, known, cards, journeys);
    for (const p of (J.head['도착'] || '').match(/P-\d{3}/g) || []) {
      const C = cards.get(p);
      if (C && !nodeRefs(C.head['근거 여정'] || '').some(([j]) => j === w)) fail(`${w}: 도착 카드 ${p}가 이 여정을 근거로 들지 않는다`);
    }
    const first = Math.min(...J.nodes.keys());
    const pointed = new Set();
    const seen = new Map();
    for (const N of J.nodes.values()) {
      const nw = `${w} T${N.n}`;
      for (const k of NODE_FIELDS) if (!N.rows[k] || PLACEHOLDER.test(plain(N.rows[k]))) fail(`${nw}: 필드 '${k}' 누락/빈칸`);
      if (N.rows['날짜'] && !/^\d{4}-\d{2}-\d{2}/.test(N.rows['날짜'])) fail(`${nw}: 날짜는 YYYY-MM-DD`);
      if (N.rows['종류'] && !KINDS.includes(N.rows['종류'])) fail(`${nw}: 종류는 ${KINDS.join('/')}`);
      const v = (N.rows['판정'] || '').split(/\s/)[0] === '부분' ? '부분 채택' : (N.rows['판정'] || '').split(/[\s(—]/)[0];
      if (N.rows['판정'] && !VERDICTS.includes(v)) fail(`${nw}: 판정은 ${VERDICTS.join('/')}`);
      N.verdict = v;
      const nx = N.rows['다음'] || '';
      const isEnd = /^끝/.test(nx);
      if (!isEnd) {
        const ts = [...nx.matchAll(/T(\d+)/g)].map(m => +m[1]);
        if (!ts.length) fail(`${nw}: 다음은 'Tn' 또는 '끝'`);
        for (const t of ts) { if (!J.nodes.has(t)) fail(`${nw}: 다음 T${t}가 없다`); pointed.add(t); }
      }
      const rec = N.rows['기록'] || '';
      if (!/^기록 없음 — .{5,}/.test(rec)) { checkIds(`${nw} 기록`, rec, known, cards, journeys); checkPaths(`${nw} 기록`, rec); }
      const sub = n => N.subs.find(s => s.name === n);
      for (const r of ['한 것', '결과']) { const s = sub(r); if (!s) fail(`${nw}: ### ${r} 누락`); else checkFilled(`${nw} ${r}`, s.body); }
      if (!isEnd) { const s = sub('왜 다음으로'); if (!s) fail(`${nw}: ### 왜 다음으로 누락 — 사슬이 끊긴다`); else checkFilled(`${nw} 왜 다음으로`, s.body); }
      if (N.rows['종류'] === '비교') { const s = sub('선택지와 기준'); if (!s) fail(`${nw}: 비교 노드는 ### 선택지와 기준 필요`); else checkFilled(`${nw} 선택지와 기준`, s.body); }
      const res = sub('결과');
      if (res && !EVIDENCE.some(t => res.body.includes(t)) && !/\b(?:[FDOR]|REF|CASE)-\d+\b/.test(res.body) && !backticks(res.body).some(p => REPO_PATH.test(p))) {
        fail(`${nw}: 결과에 근거 태그·기록 ID·경로가 없다`);
      }
      for (const s of N.subs) checkPaths(`${nw} ${s.name}`, s.body);
      for (const s of N.subs) for (const line of s.body.split('\n')) {
        const k = norm(line);
        if (k.length < 20) continue;
        if (seen.has(k) && seen.get(k) !== N.n) fail(`${nw}: T${seen.get(k)}와 같은 문장 반복 — "${line.trim().slice(0, 40)}"`);
        else seen.set(k, N.n);
      }
    }
    for (const n of J.nodes.keys()) if (n !== first && !pointed.has(n)) fail(`${w} T${n}: 어떤 노드의 '다음'에도 없다(고아 노드)`);
    checkVague(w, J.text);
  }

  // ---- cards
  const cited = { '가지 말 길': new Set(), '타협하면 안 되는 지점': new Set() };
  const lineOwner = new Map();
  for (const C of cards.values()) {
    const w = C.id;
    for (const k of P_FIELDS) if (!C.head[k] || PLACEHOLDER.test(plain(C.head[k]))) fail(`${w}: 머리표 '${k}' 누락/빈칸`);
    const st = C.head['상태'] || '';
    if (st && !/^(?:유효|잠정)(?:\s|$)|^대체됨 → P-\d{3}/.test(st)) fail(`${w}: 상태는 유효/잠정/대체됨 → P-nnn`);
    if (C.head['갱신'] && !/^\d{4}-\d{2}-\d{2}/.test(C.head['갱신'])) fail(`${w}: 갱신은 YYYY-MM-DD`);
    const reach = C.head['도달 수준'] || '';
    if (reach && !EVIDENCE.some(t => reach.includes(t)) && !backticks(reach).some(p => REPO_PATH.test(p))) fail(`${w}: 도달 수준에 증거 경로나 근거 태그가 없다`);
    checkPaths(`${w} 도달 수준`, reach);
    const enf = C.head['강제 장치'] || '';
    if (enf && !/^수동 — .{8,}/.test(enf) && !backticks(enf).some(p => REPO_PATH.test(p))) fail(`${w}: 강제 장치는 실제 경로 또는 '수동 — 사유'`);
    checkPaths(`${w} 강제 장치`, enf);
    checkIds(`${w} 머리표`, Object.values(C.head).join(' '), known, cards, journeys);
    const refs = nodeRefs(C.head['근거 여정'] || '');
    if (!refs.length) fail(`${w}: 근거 여정에 'J-nnn Tn'이 없다`);
    const verdicts = new Set();
    for (const [j, t] of refs) {
      const J = journeys.get(j);
      if (!J) continue;
      if (!J.nodes.has(t)) { fail(`${w}: 근거 ${j} T${t}가 없다`); continue; }
      verdicts.add(J.nodes.get(t).verdict);
      if (!(J.head['도착'] || '').includes(w)) fail(`${w}: ${j}의 '도착'에 이 카드가 없다`);
    }
    const names = C.secs.map(s => s.name);
    for (const n of names) if (![...P_REQUIRED, ...P_OPTIONAL].includes(n)) fail(`${w}: 알 수 없는 절 '## ${n}'`);
    for (const r of P_REQUIRED) if (!names.includes(r)) fail(`${w}: 필수 절 누락 (## ${r})`);
    const need = [['기각', '가지 말 길'], ['타협', '타협하면 안 되는 지점']];
    for (const [v, sec] of need) {
      const s = C.secs.find(x => x.name === sec);
      if (verdicts.has(v) && (!s || isNA(s.body))) fail(`${w}: 근거 여정에 '${v}' 노드가 있는데 '## ${sec}'이 없다`);
    }
    for (const s of C.secs) {
      const sw = `${w} ${s.name}`;
      checkFilled(sw, s.body);
      checkPaths(sw, s.body);
      checkIds(sw, s.body, known, cards, journeys);
      if (P_TRACED.includes(s.name) && !isNA(s.body)) {
        const bs = bullets(s.body);
        if (!bs.length) fail(`${sw}: 항목(- …)으로 쓴다`);
        for (const b of bs) {
          const r = nodeRefs(b);
          if (!r.length) fail(`${sw}: 여정 근거 (J-nnn Tn)가 없는 항목 — "${b.slice(0, 40)}"`);
          for (const [j, t] of r) {
            const J = journeys.get(j);
            if (J && !J.nodes.has(t)) fail(`${sw}: 없는 노드 ${j} T${t}`);
            if (cited[s.name]) cited[s.name].add(`${j} T${t}`);
          }
        }
      }
      if (s.name === '권장 방법' && !/`|\d/.test(s.body)) fail(`${sw}: 실행 단서(코드 표기·경로·수치)가 없다`);
      for (const line of s.body.split('\n')) {
        const k = norm(line);
        if (k.length < 20) continue;
        const o = lineOwner.get(k);
        if (o && o !== `${w}#${s.name}`) fail(`${sw}: '${o.replace('#', ' ')}'와 같은 문장 반복 — "${line.trim().slice(0, 40)}"`);
        else lineOwner.set(k, `${w}#${s.name}`);
      }
    }
    checkVague(w, C.text);
    const sup = st.match(/^대체됨 → (P-\d{3})/);
    if (sup && !cards.has(sup[1])) fail(`${w}: 대체 카드 ${sup[1]}가 없다`);
  }

  // failures must reach a card's dead-end list and compromises its compromise list, or say why not
  for (const J of journeys.values()) for (const N of J.nodes.values()) {
    const sec = { 기각: '가지 말 길', 타협: '타협하면 안 되는 지점' }[N.verdict];
    if (!sec) continue;
    if (cited[sec].has(`${J.id} T${N.n}`)) continue;
    if (/교훈 없음 — .{8,}/.test(N.body)) continue;
    fail(`${J.id} T${N.n}: '${N.verdict}' 노드가 어떤 카드의 '${sec}'에도 없다 (또는 '교훈 없음 — 사유')`);
  }

  // README index
  const readme = path.join(PB, 'README.md');
  if (!fs.existsSync(readme)) fail('docs/playbook/README.md(색인)가 없다');
  else {
    const t = read(readme);
    for (const id of [...cards.keys(), ...journeys.keys()]) if (!t.includes(id)) fail(`README 색인에 ${id}가 없다`);
    for (const m of t.matchAll(/\b([PJ]-\d{3})\b/g)) if (!cards.has(m[1]) && !journeys.has(m[1])) fail(`README 색인이 없는 ${m[1]}를 가리킨다`);
  }
  report(cards.size, journeys.size);
}

function report(nc, nj) {
  if (errors.length) {
    console.error(`\n[playbook] FAIL — ${errors.length} issue(s)`);
    for (const e of errors) console.error(` - ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[playbook] PASS — ${nc} cards, ${nj} journeys (missing + padding checks)`);
}

main();
