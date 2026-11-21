// D-189: open the 심질환 파형 tab, check each disease loads (record + heading), screenshot PVC and AF, then go back to the lab and check its scene is restored.
// node tab_check.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1700,height:1300}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.goto(BASE+'/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 const labHead=async()=>p.$eval('.viewer-heading p',e=>e.textContent);console.log('lab before:',await labHead());
 await p.getByRole('button',{name:'심질환 파형',exact:true}).click();await p.waitForTimeout(2500);
 const ids=await p.$$eval('[data-disease]',e=>e.map(x=>x.dataset.disease));console.log('diseases',ids.join(','));
 for(const id of ids){await p.click(`[data-disease="${id}"]`);await p.waitForTimeout(900);console.log(' ',id,'→',await labHead(),'| marks:',await p.$eval('.disease-panel',e=>e.querySelector('.disease-marks')?.textContent??'-'));}
 for(const id of ['pvc','afib','lbbb']){await p.click(`[data-disease="${id}"]`);await p.mouse.move(5,5);await p.waitForTimeout(1200);await p.locator('.viewer-grid').first().screenshot({path:`${TAG}_${id}.png`});}
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(6000);console.log('heart (afib):',await p.$eval('.hr-badge',e=>e.textContent));
 await p.getByRole('button',{name:'실험실',exact:true}).click();await p.waitForTimeout(2500);console.log('lab after:',await labHead(),'| disease panel present:',await p.locator('.disease-panel').count());
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
