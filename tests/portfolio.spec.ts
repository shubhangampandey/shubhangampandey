import {test,expect} from '@playwright/test';
import {watchNextBinaryBurst} from './effects-helpers';

test('six routes render without browser errors and preserve terminal history',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('UNDERSTAND');
  await expect(page.locator('.layer-card')).toHaveCount(4);
  await expect(page.locator('.wire-canvas')).toBeVisible();
  for(const route of ['projects','experience','skills','linktree','contact']){
    await page.locator(`[data-nav="${route}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${route}$`));
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.terminal-log')).toContainText(`nav /${route}`);
  }
  expect(errors).toEqual([]);
});

test('architecture unfolds and its layers and modules can be inspected',async({page})=>{
  await page.goto('/#/projects');
  const before=await page.locator('.layer-card').first().evaluate(el=>el.style.transform);
  await page.getByRole('button',{name:'Layers',exact:true}).click();
  await expect(page.locator('#depth-value')).toHaveText('100%');
  await page.waitForTimeout(2200);
  const after=await page.locator('.layer-card').first().evaluate(el=>el.style.transform);
  expect(before).not.toBe(after);
  await page.getByRole('button',{name:'Inspect Service graph module',exact:true}).click();
  await expect(page.locator('.selected-module h3')).toHaveText('Service graph');
  await page.locator('[data-project="agentfence"]').click();
  await expect(page.locator('.project-description h2')).toHaveText('AgentFence');
  await expect(page.locator('.layer-card')).toHaveCount(4);
});

test('terminal minimizes, drags and resets; command palette navigates',async({page})=>{
  await page.goto('/');
  const terminal=page.locator('.activity-terminal');
  await page.getByRole('button',{name:'Minimize activity terminal'}).click();
  await expect(terminal).toHaveClass(/is-minimized/);
  await page.getByRole('button',{name:'Expand activity terminal'}).click();
  const handle=await page.locator('.terminal-handle').boundingBox();
  await page.mouse.move(handle!.x+80,handle!.y+15);await page.mouse.down();await page.mouse.move(handle!.x+200,handle!.y-80,{steps:10});await page.mouse.up();
  await expect(terminal).toHaveClass(/is-dragged/);
  await page.getByRole('button',{name:'Reset terminal position'}).click();
  await expect(terminal).not.toHaveClass(/is-dragged/);
  await page.keyboard.press('Control+k');
  await expect(page.locator('dialog')).toBeVisible();
  await page.getByRole('textbox',{name:'Search commands'}).fill('skills');
  await page.getByRole('button',{name:'Go to Skills'}).click();
  await expect(page).toHaveURL(/\/skills$/);
});

test('audio, motion, timelines, capability views and contact actions work',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Disable sound'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Disable sound'}).click();
  await page.getByRole('button',{name:'Enable sound'}).click();
  await expect(page.getByRole('button',{name:'Disable sound'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Disable sound'}).click();
  await page.locator('[data-action="motion"]').click();
  await expect(page.locator('html')).toHaveClass(/motion-off/);
  await page.goto('/#/experience');
  await page.locator('[data-career="1"]').click();
  await expect(page.locator('[data-career="1"]')).toHaveAttribute('aria-expanded','true');
  await page.goto('/#/skills');
  await page.locator('[data-skill="TypeScript"]').click();
  await expect(page.locator('#skill-inspector h2')).toHaveText('TypeScript');
  await page.locator('[data-skill-view="list"]').click();
  await expect(page.locator('.skills-map')).toHaveClass(/list-view/);
  await page.goto('/#/contact');
  await page.getByLabel('01 / YOUR NAME').fill('Visitor');
  await page.getByLabel('02 / EMAIL ADDRESS').fill('visitor@example.com');
  await page.getByLabel('03 / THE MESSAGE').fill('A thoughtful project enquiry for a new collaboration.');
  await page.route('**/api/contact',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})}));
  await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.locator('.form-feedback')).toContainText('Message sent');
  await expect(page.getByLabel('03 / THE MESSAGE')).toHaveValue('');
});

test('mobile routes stay readable with no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const route of ['home','projects','experience','skills','linktree','contact']){
    await page.goto(`/#/${route}`);await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await page.getByRole('button',{name:'Open navigation'}).click();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await page.locator('.mobile-nav').getByRole('link',{name:'02 Projects'}).click();
  await expect(page.locator('.mobile-layer')).toHaveCount(4);
  await page.getByRole('button',{name:'Service graph',exact:true}).click();
  await expect(page.locator('.selected-module h3')).toHaveText('Service graph');
  expect(errors).toEqual([]);
});

test('effects default on despite system preferences; explicit off produces static desktop and mobile views',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/motion-off/);
  await page.locator('[data-action="motion"]').click();
  await expect(page.locator('html')).toHaveClass(/motion-off/);
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
  await page.screenshot({path:'work/screenshots/home-desktop.png',fullPage:false});
  await page.goto('/#/projects');await page.getByRole('button',{name:'Layers',exact:true}).click();await page.waitForTimeout(300);
  await page.screenshot({path:'work/screenshots/projects-desktop.png',fullPage:false});
  await page.goto('/#/skills');await page.screenshot({path:'work/screenshots/skills-desktop.png',fullPage:false});
  for(const route of ['experience','linktree','contact']){await page.goto(`/#/${route}`);await expect(page.locator('h1')).toBeVisible();await page.screenshot({path:`work/screenshots/${route}-desktop.png`,fullPage:false});}
  await page.setViewportSize({width:390,height:844});await page.goto('/#/home');await page.screenshot({path:'work/screenshots/home-mobile.png',fullPage:true});
});

test('scroll expansion reaches the full reading plane and narrow screens fit',async({page})=>{
  await page.goto('/#/projects');
  await expect(page.locator('.layer-card')).toHaveCount(4);
  await page.evaluate(()=>window.scrollTo({top:800,behavior:'instant'}));
  await expect(page.locator('#depth-value')).toHaveText('100%');
  for(const width of [320,768]){
    await page.setViewportSize({width,height:900});
    for(const route of ['home','projects','experience','skills','linktree','contact']){
      await page.goto(`/#/${route}`);await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} at ${width}px`).toBe(true);
    }
  }
});

test('all 25 skills preview on hover and keyboard focus with correct project evidence',async({page})=>{
  await page.goto('/#/skills');
  await expect(page.locator('[data-skill]')).toHaveCount(25);
  await expect(page.locator('.capability-plane')).toHaveCount(7);
  await page.locator('[data-skill="C++"]').hover();
  await expect(page.locator('#skill-inspector h2')).toHaveText('C++');
  await expect(page.locator('#skill-inspector')).toContainText('STL and algorithms');
  await page.locator('[data-skill="Python"]').focus();
  await expect(page.locator('#skill-inspector h2')).toHaveText('Python');
  await expect(page.locator('#skill-inspector .evidence-project')).toHaveCount(0);
  await page.locator('[data-skill="React.js"]').hover();
  await expect(page.locator('#skill-inspector h2')).toHaveText('React.js');
  await expect(page.locator('#skill-inspector .evidence-project')).toHaveCount(2);
  await expect(page.locator('#skill-inspector')).toContainText('AgentFence');
  await page.locator('[data-skill="AWS Fundamentals"]').hover();
  await expect(page.locator('#skill-inspector h2')).toHaveText('AWS Fundamentals');
  await expect(page.locator('#skill-inspector .evidence-project')).toHaveCount(0);
});

test('binary cursor disassembles on click, reconnects to the terminal and respects motion controls',async({page})=>{
  await page.goto('/#/linktree');
  await page.mouse.move(620,280);
  await expect(page.locator('body')).toHaveClass(/binary-cursor-enabled/);
  await watchNextBinaryBurst(page);
  await page.locator('[data-link-name="github"]').click();
  await expect(page.locator('.binary-cursor-canvas')).toHaveAttribute('data-observed-burst','disassembled');
  await expect(page.locator('.binary-cursor-canvas')).toHaveAttribute('data-phase','linked');
  await expect(page.locator('.activity-terminal')).toHaveAttribute('data-uplink','linked');
  await expect(page.locator('.terminal-log')).toContainText('pointer.reassemble');
  await watchNextBinaryBurst(page);
  await page.locator('h1').click();
  await expect(page.locator('.binary-cursor-canvas')).toHaveAttribute('data-observed-burst','disassembled');
  await expect(page.locator('.binary-cursor-canvas')).toHaveAttribute('data-phase','linked');
  await page.locator('[data-action="motion"]').click();
  await expect(page.locator('.binary-cursor-canvas')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/binary-cursor-enabled/);
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
  await expect(page.locator('.binary-cursor-canvas')).toBeHidden();
});

test('the two real projects expose their engineering notes and scope boundaries',async({page})=>{
  await page.goto('/#/projects?project=causalscope');
  await expect(page.locator('.project-description h2')).toHaveText('CausalScope');
  await expect(page.locator('.project-case-study')).toContainText('OpenTelemetry');
  await expect(page.locator('.project-boundary')).toContainText('SQLite');
  await page.locator('[data-project="agentfence"]').click();
  await expect(page.locator('.project-case-study')).toContainText('OPA/Rego');
  await expect(page.locator('.project-boundary')).toContainText('synthetic');
  await expect(page.locator('.project-choice')).toHaveCount(2);
  await expect(page).toHaveURL(/project=agentfence/);
  await page.reload();
  await expect(page.locator('.project-description h2')).toHaveText('AgentFence');
});

test('touch skill selection brings the summary next to its group and restores the desktop layout',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#/skills');
  await page.locator('[data-skill="Python"]').click();
  await expect(page.locator('#skill-inspector')).toHaveClass(/skill-inspector-inline/);
  await expect(page.locator('#skill-inspector h2')).toHaveText('Python');
  expect(await page.locator('[data-skill="Python"]').evaluate(el=>el.closest('.capability-plane')?.nextElementSibling?.id)).toBe('skill-inspector');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.setViewportSize({width:1440,height:1000});
  await expect(page.locator('.skills-layout > #skill-inspector')).toBeVisible();
});
