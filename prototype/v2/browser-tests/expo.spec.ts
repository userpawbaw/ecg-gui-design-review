import {test,expect} from '@playwright/test';
test('large viewer, real sweep/scroll, hover, freeze, keyboard and download',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('button',{name:'크게 비교'})).toBeEnabled();
 await page.screenshot({path:info.outputPath('01-lab.png'),fullPage:true});await page.getByRole('button',{name:'크게 비교'}).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'재생',exact:true}).click();await expect.poll(()=>dialog.locator('canvas').getAttribute('data-time')).not.toBe('5.000');
 await page.waitForTimeout(6000);await dialog.getByRole('button',{name:'일시정지',exact:true}).click();await page.screenshot({path:info.outputPath('02-sweep.png')});
 await dialog.getByRole('button',{name:'Scroll',exact:true}).click();await dialog.getByRole('button',{name:'재생',exact:true}).click();await page.waitForTimeout(1200);await dialog.getByRole('button',{name:'구간 고정',exact:true}).click();
 const before=await dialog.locator('canvas').getAttribute('data-time');await dialog.locator('[data-method="M04"]').hover();await expect(dialog.getByText('미리보기 · M04',{exact:true})).toBeVisible();await expect(dialog.locator('[data-method="M08"]')).toHaveAttribute('aria-pressed','true');await expect(dialog.locator('canvas')).toHaveAttribute('data-time',before!);
 await dialog.locator('[data-method="M04"]').click();await expect(dialog.locator('[data-method="M04"]')).toHaveAttribute('aria-pressed','true');await page.screenshot({path:info.outputPath('03-focus.png')});await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.locator('[data-open-large]')).toBeFocused();
 await page.getByText('검토 기록과 JSON 내보내기',{exact:true}).click();await page.getByLabel('메모',{exact:true}).fill('자동 PC 검수');const download=page.waitForEvent('download');await page.getByRole('button',{name:'검토 JSON 저장'}).click();await (await download).saveAs(info.outputPath('review.json'));
 await page.setViewportSize({width:1366,height:768});await page.screenshot({path:info.outputPath('04-small-desktop.png'),fullPage:true});expect(errors).toEqual([]);
});
test('ten-minute actual replay soak',async({page},info)=>{
 test.skip(process.env.ECG_SOAK!=='1','Set ECG_SOAK=1 to run the actual ten-minute timing test.');test.setTimeout(660000);
 await page.goto('/');await expect(page.getByLabel('자료 길이')).toBeVisible();await page.getByLabel('자료 길이').selectOption('long');await expect(page.getByRole('button',{name:'크게 비교'})).toBeEnabled();await page.getByRole('button',{name:'처음으로',exact:true}).click();await page.getByRole('button',{name:'재생',exact:true}).click();
 await page.waitForTimeout(605000);await expect(page.getByRole('button',{name:'재생',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveAttribute('data-time','600.000');await page.screenshot({path:info.outputPath('10-minute-end.png')});
});
