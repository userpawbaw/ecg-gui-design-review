// Windows (cp949) guard: every text-mode file access in tracked Python files must say encoding='utf-8'.
// Without it Python uses the OS locale — on Korean Windows that is cp949 and UTF-8 JSON/Markdown fails
// (UnicodeDecodeError on read, UnicodeEncodeError on write). O-004.
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert');

function closeParen(s, i) {
  let d = 0, q = null;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === q && s[j - 1] !== '\\') q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '(') d++;
    else if (c === ')' && --d === 0) return j;
  }
  return -1;
}
function findings(src) {
  const out = [], re = /(?<![\w.])open\(|\.read_text\(|\.write_text\(/g;
  let m;
  while ((m = re.exec(src))) {
    const o = m.index + m[0].length - 1, c = closeParen(src, o), args = src.slice(o + 1, c);
    const binary = m[0].startsWith('open') && /['"][rwax+]*b[rwax+]*['"]/.test(args);
    if (!binary && !/encoding\s*=/.test(args)) out.push({line: src.slice(0, m.index).split('\n').length, call: src.slice(m.index, c + 1)});
  }
  return out;
}
// self-test: the detector must flag and pass the right cases
assert.equal(findings("json.load(open(p))").length, 1);
assert.equal(findings("open(p, 'w')").length, 1);
assert.equal(findings("path.read_text()").length, 1);
assert.equal(findings("path.write_text(json.dumps(x))").length, 1);
assert.equal(findings("open(p, encoding='utf-8')").length, 0);
assert.equal(findings("open(p, 'rb')").length, 0);
assert.equal(findings("Image.open(p); urllib.request.urlopen(u)").length, 0);

const files = execFileSync('git', ['ls-files', '*.py'], {encoding: 'utf8'}).split('\n').filter(Boolean);
const bad = [];
for (const f of files) for (const x of findings(fs.readFileSync(f, 'utf8'))) bad.push(`${f}:${x.line}  ${x.call.slice(0, 90)}`);
if (bad.length) {
  console.error(`[encoding] FAIL — ${bad.length} text-mode file access without encoding='utf-8' (breaks on cp949 Windows):\n  ` + bad.join('\n  '));
  process.exit(1);
}
console.log(`[encoding] PASS — ${files.length} Python files, all text-mode open/read_text/write_text specify encoding (detector self-test 7/7)`);
