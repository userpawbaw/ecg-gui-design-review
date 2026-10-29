import {test,expect} from '@playwright/test';
// R1 story shell (HYB-R1-001): wheel gesture = one step, method dots persist, stored values, Lab handoff keeps the scene.
test('story: attract → conditions → grid → bars → Lab on the same scene',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?step=0');await page.waitForFunction(()=>(window as any).__story);
 await expect(page.locator('.story')).toHaveAttribute('data-step','0');await expect(page.getByText('ARCHIVED REPLAY — 실제 장치 세션 없음')).toBeVisible();
 const burst=(dy:number,n:number)=>page.evaluate(([dy,n])=>new Promise<void>(r=>{let i=0;const t=setInterval(()=>{dispatchEvent(new WheelEvent('wheel',{deltaY:dy,cancelable:true}));if(++i>=n){clearInterval(t);r();}},30);}),[dy,n]);
 await burst(120,20);await expect(page.locator('.story')).toHaveAttribute('data-step','1');
 await expect(page.locator('.st-dot[data-main]')).toHaveCount(10);await expect(page.locator('.st-dot.winner .val')).toHaveText('SNR 개선 19.45 dB');
 await page.waitForTimeout(900);await burst(120,3);await expect(page.locator('.story')).toHaveAttribute('data-step','2');await expect(page.locator('.st-dot.winner .code')).toHaveText('M_FE');
 await page.waitForTimeout(900);await page.keyboard.press('ArrowRight');await expect(page.locator('.story')).toHaveAttribute('data-step','3');await expect(page.locator('.st-dot.winner .code')).toHaveText('M06L6');
 await expect(page.locator('.st-dot[data-main]')).toHaveCount(10);
 await page.keyboard.press('ArrowRight');await expect(page.locator('.story')).toHaveAttribute('data-step','4');await expect(page.locator('.st-clone')).toHaveCount(49-7);
 await page.keyboard.press('ArrowRight');await expect(page.locator('.story')).toHaveAttribute('data-step','5');await expect(page.locator('.st-bar')).toHaveCount(11);
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');await expect(page.locator('.story')).toHaveAttribute('data-step','3');
 await page.getByRole('button',{name:'클릭해 직접 바꿔 보기 →'}).click();
 await expect(page.locator('.story')).toHaveCount(0,{timeout:15000});
 const lab=page.locator('.large-dialog canvas.ecg-canvas');await expect(lab).toHaveAttribute('data-mode','inspect');await expect(lab).toHaveAttribute('aria-label',/M06L6 출력/);
 await expect(page.locator('.large-dialog .viewer-heading p')).toContainText('S038 · 근육 잡음 · 합성 · 20 dB');
 expect(errors).toEqual([]);
});
test('story: reduced motion keeps the structure',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?step=0');await page.waitForFunction(()=>(window as any).__story);
 await expect(page.locator('.story.reduced')).toHaveCount(1);await page.keyboard.press('ArrowRight');await expect(page.locator('.story')).toHaveAttribute('data-step','1');await expect(page.locator('.st-dot[data-main]')).toHaveCount(10);
});
