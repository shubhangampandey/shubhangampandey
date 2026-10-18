import {test,expect} from '@playwright/test';
import {watchNextBinaryBurst} from './effects-helpers';

test('effects default on in a fresh narrow reduced-motion browser and retain an explicit choice',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:690,height:668},hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  // A legacy value must not bring back the old preference-derived default.
  await page.addInitScript(()=>localStorage.setItem('orbital.motion','off'));
  await page.goto('/#/home');
  await expect(page.locator('html')).not.toHaveClass(/motion-off/);
  await expect(page.locator('.binary-cursor-canvas')).toBeVisible();
  // This browser reports a coarse pointer, but the user can still operate an attached mouse.
  expect(await page.evaluate(()=>matchMedia('(pointer:fine)').matches)).toBe(false);
  await page.mouse.move(450,300,{steps:8});
  await expect(page.locator('body')).toHaveClass(/binary-cursor-enabled/);
  await watchNextBinaryBurst(page);
  await page.mouse.click(460,310);
  await expect(page.locator('.binary-cursor-canvas')).toHaveAttribute('data-observed-burst','disassembled');
  await expect(page.locator('.binary-cursor-canvas')).toHaveAttribute('data-phase','linked');
  expect(await page.locator('.binary-cursor-canvas').evaluate((canvas:HTMLCanvasElement)=>{
    const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
    let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>40)count++;return count;
  })).toBeGreaterThan(100);
  await page.reload();await expect(page.locator('.status-bar [data-action="motion"]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('link',{name:'Inspect projects',exact:true}).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('.status-bar [data-action="motion"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-action="motion"]').click();
  await expect(page.locator('.binary-cursor-canvas')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/binary-cursor-enabled/);
  await page.reload();await expect(page.locator('html')).toHaveClass(/motion-off/);
  await context.close();
});

test('console stays expanded until its minus button is clicked',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/#/home');
  const terminal=page.locator('.activity-terminal');
  await expect(terminal).not.toHaveClass(/is-minimized/);
  for(const route of ['projects','experience','skills','linktree','contact','home']){
    await page.goto(`/#/${route}`);await expect(page.locator('h1')).toBeVisible();
    await expect(terminal).not.toHaveClass(/is-minimized/);
  }
  await page.keyboard.press('`');await expect(terminal).not.toHaveClass(/is-minimized/);
  await page.locator('[data-action="terminal"]').click();await expect(terminal).not.toHaveClass(/is-minimized/);
  await page.setViewportSize({width:1440,height:1000});await expect(terminal).not.toHaveClass(/is-minimized/);
  await page.getByRole('button',{name:'Minimize activity terminal',exact:true}).click();
  await expect(terminal).toHaveClass(/is-minimized/);
  await page.goto('/#/skills');await expect(terminal).toHaveClass(/is-minimized/);
  const otherTab=await page.context().newPage();await otherTab.goto('about:blank');await otherTab.bringToFront();await page.bringToFront();await otherTab.close();
  await expect(terminal).toHaveClass(/is-minimized/);
  await page.locator('[data-action="terminal"]').click();await expect(terminal).not.toHaveClass(/is-minimized/);
});

test('all five non-home pages share the home portrait and animated scanner without overflow',async({page})=>{
  test.setTimeout(60000); // Twenty route/viewport combinations, including 3D scene initialization.
  for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:1000});
    for(const route of ['projects','experience','skills','linktree','contact']){
      await page.goto(`/#/${route}`);
      const identity=page.locator('.page-intro .page-identity');
      await expect(identity).toBeVisible();await expect(identity.locator('.hero-identity')).toHaveCount(1);
      await expect(identity.getByRole('img',{name:'Shubhangam Pandey',exact:true})).toBeVisible();
      await expect(page.getByRole('img',{name:'Shubhangam Pandey',exact:true})).toHaveCount(1);
      await expect(identity.locator('.identity-signal')).toContainText(`SCANNING / ${route.toUpperCase()}`);
      expect(await identity.locator('.portrait-scan').evaluate(el=>getComputedStyle(el).animationName)).toBe('portrait-scan');
      expect(await identity.locator('.circuit-packets').evaluate(el=>getComputedStyle(el).animationName)).toBe('circuit-flow');
      if(width>=760){
        const photo=await identity.boundingBox(),intro=await page.locator('.page-intro').boundingBox();
        expect(photo!.x).toBeGreaterThan(intro!.x+intro!.width/2);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} at ${width}px`).toBe(true);
    }
  }
});

test('scroll reveals and hover feedback render real animations',async({page})=>{
  await page.goto('/#/home');
  await expect(page.locator('.project-tile').first()).toHaveAttribute('data-fx-reveal','pending');
  await page.locator('.project-tile').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.project-tile').first()).toHaveAttribute('data-fx-reveal','visible');
  expect(await page.locator('.project-tile').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('reveal-signal');
  await page.locator('.project-tile').first().hover();
  await expect(page.locator('.project-tile').first()).toHaveAttribute('data-fx-interaction',/[012]/);
  await expect(page.locator('.cyber-event-hud')).toContainText(/SCROLL/);
});

test('personal identity, real experience and document placeholders replace template content',async({page})=>{
  await page.goto('/#/home');
  await expect(page).toHaveTitle(/SHUBHANGAM PANDEY/);
  const portrait=page.getByRole('img',{name:'Shubhangam Pandey',exact:true});
  await expect(portrait).toBeVisible();expect(await portrait.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  await expect(page.locator('.identity-circuit')).toBeVisible();
  await page.goto('/#/experience');
  await expect(page.locator('.career-entry')).toHaveCount(2);
  await expect(page.locator('.career-timeline')).toContainText('UDRcraft Private Limited');
  await expect(page.locator('.career-timeline')).toContainText('Prodigy InfoTech Private Limited');
  await expect(page.locator('.career-timeline')).toContainText('09/2025 – 07/2026');
  await expect(page.locator('.career-timeline')).toContainText('01/2026 – 02/2026');
  await expect(page.locator('.career-contributions')).toContainText('40%');
  await expect(page.locator('main')).not.toContainText(/ILLUSTRATIVE CONTENT|YOUR DATES|timeline is a template/);
  await page.locator('[data-career="1"]').click();
  await expect(page.locator('#career-record-1')).toContainText('Remote');
  await expect(page.locator('#career-record-1 li')).toHaveCount(0);
  await page.goto('/#/linktree');
  await expect(page.locator('.directory-topline')).toContainText('10 DESTINATIONS');
  for(const key of ['certificates','recommendation']){
    await expect(page.locator(`[data-link-name="${key}"]`)).toContainText('NOT LINKED');
    await page.locator(`[data-link-name="${key}"]`).click();
    await expect(page.locator('.toast')).toContainText('not connected yet');
  }
});
