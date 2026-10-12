import {test,expect} from '@playwright/test';
// REVIEW-R1-STORY-20261011 S-06 / S-07 / S-08 (D-063): after the one beat-released pass the wheel moves the input ↔ output
// cross-fade both ways, never the scene; the next scene and the overlay are buttons at the clean end.
test('story noise: wheel never changes the scene; overlay and next are buttons',async({page})=>{
 test.setTimeout(600000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?story=noise&cond=all');await page.waitForFunction(()=>(window as any).__noise?.ready,null,{timeout:120000});
 const actions=page.locator('.ns-actions');const title=page.locator('.ns-title b');
 await expect(title).toHaveText('전원 간섭');
 const wheel=(dy:number,n:number)=>page.evaluate(([dy,n])=>{for(let i=0;i<n;i++)dispatchEvent(new WheelEvent('wheel',{deltaY:dy}));},[dy,n]);
 await wheel(120,25);await expect(title).toHaveText('전원 간섭');                     // no skip by wheel (A-06)
 await expect(actions).toHaveClass(/\bon\b/,{timeout:240000});                         // clean end reached after the auto pass
 await wheel(-120,10);await expect(actions).not.toHaveClass(/\bon\b/,{timeout:20000});                 // back toward the noisy input
 await wheel(120,12);await expect(actions).toHaveClass(/\bon\b/,{timeout:60000});
 await page.getByRole('button',{name:'두 신호 겹쳐 보기'}).click();
 await expect(page.getByRole('button',{name:'한 신호로 보기'})).toBeVisible({timeout:30000});
 await wheel(-120,10);await expect(page.getByRole('button',{name:'한 신호로 보기'})).toBeVisible({timeout:30000});   // scroll ignored while overlaid
 await page.getByRole('button',{name:'한 신호로 보기'}).click();await expect(page.getByRole('button',{name:'두 신호 겹쳐 보기'})).toBeVisible({timeout:30000});
 await expect(title).toHaveText('전원 간섭');
 await page.getByRole('button',{name:'다음 장면 →'}).click();
 await expect(title).toHaveText('기저선 변동',{timeout:15000});
 expect(errors).toEqual([]);
});
