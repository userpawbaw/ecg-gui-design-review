// 실시간 탭에서 1 s 동안 바뀌는 DOM(속성 · 글자 · 자식) — 매 프레임 화면을 다시 칠하게 만드는 범인 찾기
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032}});
 await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);
 const r=await p.evaluate(()=>new Promise(res=>{const cnt=new Map();const key=(n)=>{const e=n.nodeType===1?n:n.parentElement;if(!e)return '?';return e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.split(' ').slice(0,2).join('.'):'');};
  const mo=new MutationObserver(ms=>{for(const m of ms){const k=m.type+':'+key(m.target)+(m.attributeName?'@'+m.attributeName:'');cnt.set(k,(cnt.get(k)||0)+1);}});mo.observe(document.body,{subtree:true,attributes:true,characterData:true,childList:true});
  setTimeout(()=>{mo.disconnect();res([...cnt].sort((a,b)=>b[1]-a[1]).slice(0,25));},2000);}));
 for(const [k,n] of r)console.log(String(n).padStart(5),k);await b.close();})();
