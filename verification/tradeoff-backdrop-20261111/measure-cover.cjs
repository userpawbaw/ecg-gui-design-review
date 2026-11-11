const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
const sel='header,.page-heading,.condition-bar,.signal-panel,.method-panel,.metrics,.bookmarks,.live-head,.live-shell canvas,.live-methods,.live-route>*,button,footer';
async function measure(label){
 const r=await p.evaluate((sel)=>{const W=innerWidth,H=innerHeight,g=new Uint8Array(W*H/16);let opaque=0;
  for(const el of document.querySelectorAll(sel)){const cs=getComputedStyle(el);const bg=cs.backgroundColor;const m=bg.match(/rgba?\(([^)]+)\)/);let a=0;if(m){const v=m[1].split(/[ ,\/]+/).filter(Boolean);a=v.length>3?parseFloat(v[3]):1;}
   if(el.tagName==='CANVAS')a=1;if(a<.5)continue;const q=el.getBoundingClientRect();
   for(let y=Math.max(0,q.top|0);y<Math.min(H,q.bottom);y+=4)for(let x=Math.max(0,q.left|0);x<Math.min(W,q.right);x+=4)g[(y>>2)*(W>>2)+(x>>2)]=1;}
  let c=0;for(const v of g)c+=v;
  // fraction of free pixels in the top band (above the first big panel)
  return {covered:c/g.length,scrollMax:document.documentElement.scrollHeight-innerHeight};},sel);
 console.log(label,JSON.stringify(r));}
await p.goto('http://127.0.0.1:5179/?route=lab',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
await measure('lab top');await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(600);await measure('lab bottom');
await p.screenshot({path:process.argv[2]+'/lab-top-cover.png'});
await p.evaluate(()=>scrollTo(0,0));await p.getByRole('button',{name:'실시간 측정'}).click();await p.waitForTimeout(1500);await measure('live top');
await p.screenshot({path:process.argv[2]+'/live-cover.png'});
await b.close();})();
