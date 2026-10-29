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

// A-05 (REVIEW-R1-STORY-20261011): keyboard only + reduced motion. The arrow keys move the cross-fade, Tab reaches the two
// buttons only at the clean end (focus-visible), Enter/Space press them; with reduced motion the cross-fade jumps (no glide).
test('story noise: keyboard-only control with reduced motion',async({page})=>{
 test.setTimeout(600000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?story=noise&cond=all');await page.waitForFunction(()=>(window as any).__noise?.ready,null,{timeout:120000});
 const actions=page.locator('.ns-actions');const title=page.locator('.ns-title b');
 await expect(actions).toHaveClass(/\bon\b/,{timeout:240000});                         // reduced: the auto pass lands at once
 const overlay=page.getByRole('button',{name:'두 신호 겹쳐 보기'});
 await page.keyboard.press('PageUp');await expect(actions).not.toHaveClass(/\bon\b/,{timeout:20000});
 for(const b of await actions.locator('button').all())expect(await b.getAttribute('tabindex')).toBe('-1');   // hidden (aria-hidden) buttons stay out of the Tab order
 await page.keyboard.press('PageDown');await page.keyboard.press('PageDown');await expect(actions).toHaveClass(/\bon\b/,{timeout:20000});
 let hit=false;for(let i=0;i<8&&!hit;i++){await page.keyboard.press('Tab');hit=await overlay.evaluate(e=>e===document.activeElement);}
 expect(hit).toBe(true);
 expect(await overlay.evaluate(e=>e.matches(':focus-visible'))).toBe(true);
 await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'한 신호로 보기'})).toBeVisible({timeout:30000});
 await page.getByRole('button',{name:'한 신호로 보기'}).focus();await page.keyboard.press('Space');
 await expect(overlay).toBeVisible({timeout:30000});
 await page.keyboard.press('Tab');
 const next=page.getByRole('button',{name:'다음 장면 →'});
 expect(await next.evaluate(e=>e===document.activeElement)).toBe(true);
 await page.keyboard.press('Enter');await expect(title).toHaveText('기저선 변동',{timeout:15000});
 expect(errors).toEqual([]);
});
