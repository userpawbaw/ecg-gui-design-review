import {chromium} from '@playwright/test';
import {mkdir,unlink,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createServer} from 'vite';

const out=resolve('../../verification/attract-vnext');await mkdir(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5173}});await server.listen();
const localUrl=server.resolvedUrls.local[0];
const executablePath=process.env.CHROME_BIN;
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
const results={consoleErrors:[],transitions:[],motion:{},fps:{}};
async function setup(reducedMotion='no-preference',recordVideo=false){
 const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion,...(recordVideo?{recordVideo:{dir:out,size:{width:1920,height:1080}}}:{})});
 const page=await context.newPage();page.on('console',m=>{if(m.type()==='error')results.consoleErrors.push(m.text());});page.on('pageerror',e=>results.consoleErrors.push(String(e)));
 await page.goto(localUrl,{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{await document.fonts.ready;return true;});
 await page.getByRole('button',{name:'B · Transformation Stage'}).waitFor({state:'visible',timeout:30000});
 return{context,page};
}
async function profile(page,label,ms=5000){
 await page.evaluate(()=>{window.__frames=[];let last=0;const step=t=>{if(last)window.__frames.push(t-last);last=t;if(window.__frames.length<5000)requestAnimationFrame(step);};requestAnimationFrame(step);});
 await page.waitForTimeout(ms);
 const frames=await page.evaluate(()=>window.__frames);const sorted=frames.filter(n=>n>0).sort((a,b)=>a-b);
 results.fps[label]={samples:sorted.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)]};
}
const recording=process.env.RECORD_VIDEO==='1';
let {context,page}=await setup('no-preference',recording);
await page.getByRole('button',{name:'B · Transformation Stage'}).click();await page.locator('[data-attract="b"] canvas').waitFor();
await page.waitForTimeout(500);await page.screenshot({path:join(out,'B-1920x1080.png')});
const sceneB=await page.locator('[data-attract="b"]').getAttribute('data-scene');const methodB=await page.locator('[data-attract="b"]').getAttribute('data-method');
const slider=page.getByRole('slider',{name:/비교 렌즈 경계/});await slider.focus();await slider.press('ArrowRight');
results.transitions.push({step:'B lens keyboard',before:50,after:await slider.inputValue()});
await profile(page,'B');
const beforeB=await page.locator('[data-attract="b"] canvas').getAttribute('data-time');
await page.getByRole('button',{name:'직접 비교하기'}).click();await page.getByRole('button',{name:'B · Transformation Stage'}).waitFor();
results.transitions.push({step:'B to Compare',sceneBefore:sceneB,methodBefore:methodB,timeBefore:Number(beforeB),timeAfter:await page.locator('.ecg-canvas').first().getAttribute('data-time')});
await page.getByRole('button',{name:'A · Signal Field'}).click();await page.locator('[data-attract="a"] canvas').waitFor();await page.waitForTimeout(450);await page.screenshot({path:join(out,'A-1920x1080.png')});
await profile(page,'A');
const sceneA=await page.locator('[data-attract="a"]').getAttribute('data-scene');const methodA=await page.locator('[data-attract="a"]').getAttribute('data-method');
await page.getByRole('button',{name:/다음 · Transformation Stage/}).click();results.transitions.push({step:'A to B',scene:await page.locator('[data-attract="b"]').getAttribute('data-scene'),method:await page.locator('[data-attract="b"]').getAttribute('data-method')});
await page.getByRole('button',{name:'A 시안'}).click();const clickTime=Number(await page.locator('[data-attract="a"] canvas').getAttribute('data-time'));
await page.locator('.attract-primary').click();await page.getByRole('button',{name:'A · Signal Field'}).waitFor({timeout:10000});
results.transitions.push({step:'A accelerated handoff',sceneBefore:sceneA,methodBefore:methodA,clickTime,timeAfter:Number(await page.locator('.ecg-canvas').first().getAttribute('data-time'))});
const runtimeVideo=page.video();await context.close();if(runtimeVideo){await runtimeVideo.saveAs(join(out,'A-B-Compare-runtime.webm'));await unlink(await runtimeVideo.path());}
({context,page}=await setup('reduce'));await page.getByRole('button',{name:'A · Signal Field'}).click();
await page.locator('[data-attract="a"] canvas').waitFor();const reducedStart=await page.locator('[data-attract="a"] canvas').getAttribute('data-time');
await page.waitForTimeout(350);results.motion={reducedMotion:true,pausedOnEntry:reducedStart===await page.locator('[data-attract="a"] canvas').getAttribute('data-time')};
await page.locator('.attract-primary').click();await page.getByRole('button',{name:'A · Signal Field'}).waitFor({timeout:10000});results.motion.handoff=true;
await context.close();await browser.close();await server.close();await writeFile(join(out,'runtime-results.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
