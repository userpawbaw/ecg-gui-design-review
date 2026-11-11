import json, os, subprocess, sys, tempfile
work, base = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
JS = r'''
const path=require('path');const {makeSignal}=require(path.join(process.argv[2],'signal.js'));
const A=require(path.join(process.argv[2],'overview.js')),B=require(path.join(process.argv[3],'overview.js'));
const s=makeSignal();const out={};
function ext(img,w,h){const top=new Int32Array(w).fill(-1),bot=new Int32Array(w).fill(-1);for(let x=0;x<w;x++){for(let y=0;y<h;y++)if(img[y*w+x]){if(top[x]<0)top[x]=y;bot[x]=y;}}return [top,bot];}
let worstRatio=1e9,extOk=true,inkDiff=0,bad=0;
for(const [w,h] of [[1600,240],[900,200],[2400,300]]){
  let tb=1e9,tw=1e9,ib,iw;
  for(let k=0;k<1;k++){let t=process.hrtime.bigint();ib=A.renderOverview(s,w,h,-0.5,2.0);tb=Math.min(tb,Number(process.hrtime.bigint()-t)/1e6);}
  for(let k=0;k<3;k++){let t=process.hrtime.bigint();iw=B.renderOverview(s,w,h,-0.5,2.0);tw=Math.min(tw,Number(process.hrtime.bigint()-t)/1e6);}
  if(!iw||iw.length!==w*h){extOk=false;bad++;continue;}
  const [t1,b1]=ext(ib,w,h),[t2,b2]=ext(iw,w,h);
  for(let x=0;x<w;x++)if(t1[x]!==t2[x]||b1[x]!==b2[x]){extOk=false;bad++;}
  let d=0;for(let i=0;i<ib.length;i++)if(ib[i]!==iw[i])d++;inkDiff=Math.max(inkDiff,d/ib.length);
  worstRatio=Math.min(worstRatio,tb/tw);out[w]={base_ms:Math.round(tb),after_ms:+tw.toFixed(1)};
}
// odd input: short record and non-default range
const s2=s.subarray(0,777);const a=A.renderOverview(s2,1000,100,-1,3),b=B.renderOverview(s2,1000,100,-1,3);
let small=true;const [t1,b1]=ext(a,1000,100),[t2,b2]=ext(b,1000,100);for(let x=0;x<1000;x++)if(t1[x]!==t2[x]||b1[x]!==b2[x])small=false;
console.log(JSON.stringify({out,worstRatio,extOk,bad,inkDiff,small}));
'''
f = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False); f.write(JS); f.close()
p = subprocess.run(["node", f.name, base, work], capture_output=True, text=True, timeout=600)
try: r = json.loads(p.stdout.strip().splitlines()[-1])
except Exception: r = None
if not r:
    print(json.dumps({"metrics": {}, "assertions": [{"text": "overview.js still exports renderOverview(samples,width,height,vmin,vmax) and runs", "passed": False, "evidence": (p.stdout + p.stderr)[-500:]}]})); sys.exit()
print(json.dumps({"metrics": {"speedup_worst": round(r["worstRatio"], 1), "times": r["out"], "extreme_mismatch_columns": r["bad"], "pixel_diff_fraction": round(r["inkDiff"], 4)},
 "assertions": [
  {"text": "per-column highest and lowest inked pixel equal the original renderer at three widths (display contract)", "passed": r["extOk"], "evidence": f'{r["bad"]} mismatching columns'},
  {"text": "renderOverview is at least 4x faster than the original at every tested width", "passed": r["worstRatio"] >= 4, "evidence": json.dumps(r["out"])},
  {"text": "a record shorter than the width (777 samples, 1000 px) still matches the original column extremes", "passed": r["small"], "evidence": str(r["small"])}]}, ensure_ascii=False))
