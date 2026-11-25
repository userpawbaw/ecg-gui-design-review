const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032}});
 await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'load'});await p.waitForTimeout(1500);
 const info=()=>p.evaluate(()=>({videos:[...document.querySelectorAll('video')].map(v=>v.src.split('/').pop()+(v.paused?' 멈춤':' 재생 중')+' '+getComputedStyle(v).display),canvases:[...document.querySelectorAll('canvas')].map(c=>(c.className||'canvas')+' '+c.width+'x'+c.height+' '+getComputedStyle(c).display),intro:!!document.querySelector('.intro'),url:location.search}));
 console.log('실험실 진입:',JSON.stringify(await info()));
 await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(3000);
 console.log('실시간 탭:',JSON.stringify(await info()));await b.close();})();
