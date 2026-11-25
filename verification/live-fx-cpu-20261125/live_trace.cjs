// 실시간 탭 3 s 추적: 프로세스 · 스레드별 상위 이벤트(자기 시간 합) — gpu-process가 무엇을 하나
const {chromium}=require('playwright'),fs=require('fs');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032}});
 await p.goto(process.argv[2]+'/?route=lab'+(process.argv[4]||''),{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);
 if(process.argv[3])await p.addStyleTag({content:process.argv[3]});await p.waitForTimeout(1000);
 await b.startTracing(p,{path:'trace.json',categories:['gpu','cc','viz','toplevel','blink','disabled-by-default-devtools.timeline','v8','benchmark','renderer.scheduler']});await p.waitForTimeout(3000);await b.stopTracing();
 const ev=JSON.parse(fs.readFileSync('trace.json','utf8')).traceEvents;const pn={},tn={};for(const e of ev)if(e.ph==='M'){if(e.name==='process_name')pn[e.pid]=e.args.name;if(e.name==='thread_name')tn[e.pid+':'+e.tid]=e.args.name;}
 const agg=new Map();for(const e of ev)if(e.ph==='X'&&e.dur){const k=(pn[e.pid]||e.pid)+' / '+(tn[e.pid+':'+e.tid]||e.tid)+' / '+e.name;agg.set(k,(agg.get(k)||0)+e.dur);}
 const top=[...agg].sort((a,b)=>b[1]-a[1]).slice(0,30);for(const [k,v] of top)console.log((v/1000/3).toFixed(0).padStart(5),'ms/s',k);fs.unlinkSync('trace.json');await b.close();})();
