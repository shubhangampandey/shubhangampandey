import {test,expect,type Page} from '@playwright/test';

type Probe={contexts:AudioContext[];tones:number[]};
async function observeAudio(page:Page){
  await page.addInitScript(()=>{
    const probe:Probe={contexts:[],tones:[]};
    (window as unknown as {audioProbe:Probe}).audioProbe=probe;
    const NativeAudioContext=window.AudioContext;
    window.AudioContext=class extends NativeAudioContext{
      constructor(options?:AudioContextOptions){super(options);probe.contexts.push(this);}
      createOscillator(){
        const osc=super.createOscillator(),setFrequency=osc.frequency.setValueAtTime.bind(osc.frequency),start=osc.start.bind(osc);
        let initial:number|undefined;
        osc.frequency.setValueAtTime=(value:number,time:number)=>{initial=value;return setFrequency(value,time);};
        osc.start=(when?:number)=>{probe.tones.push(initial??osc.frequency.value);start(when);};
        return osc;
      }
    };
  });
}
const tones=(page:Page)=>page.evaluate(()=>(window as unknown as {audioProbe:Probe}).audioProbe.tones);
const state=(page:Page)=>page.evaluate(()=>(window as unknown as {audioProbe:Probe}).audioProbe.contexts[0]?.state);

test('SFX defaults ON and real clicks and immediate navigation create audible cue graphs',async({page})=>{
  await observeAudio(page);await page.goto('/#/skills');
  await expect(page.getByRole('button',{name:'Disable sound',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.locator('h1').click();
  await expect.poll(()=>state(page)).toBe('running');
  await expect.poll(async()=>(await tones(page)).includes(740)).toBe(true);
  const first=(await tones(page)).filter(f=>f===740).length;
  await page.locator('h1').click();
  await expect.poll(async()=>(await tones(page)).filter(f=>f===740).length).toBe(first+1);
  const before=(await tones(page)).length;
  await page.locator('[data-nav="contact"]').hover();await page.locator('[data-nav="contact"]').click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect.poll(async()=>(await tones(page)).slice(before).includes(220)).toBe(true);
  expect((await tones(page)).slice(before)).toContain(740);
});

test('tab visibility and window focus play separate cues and recover the real audio context',async({page})=>{
  await observeAudio(page);await page.goto('/#/linktree');await page.locator('h1').click();
  await expect.poll(()=>state(page)).toBe('running');
  const before=(await tones(page)).length;
  // Headless Chromium keeps its tabs visible; dispatch the lifecycle with the same hidden state.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));});
  await expect.poll(async()=>(await tones(page)).slice(before).includes(360)).toBe(true);
  await expect.poll(()=>state(page)).toBe('suspended');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
  await expect.poll(async()=>(await tones(page)).slice(before).includes(520)).toBe(true);
  await expect.poll(()=>state(page)).toBe('running');
  expect((await tones(page)).slice(before).filter(f=>f===520)).toHaveLength(1);
  await page.evaluate(()=>Reflect.deleteProperty(document,'hidden'));
});

test('explicit mute silences global clicks, navigation and tab cues and survives reload',async({page})=>{
  await observeAudio(page);await page.goto('/#/linktree');await page.locator('h1').click();
  await expect.poll(()=>state(page)).toBe('running');
  await page.getByRole('button',{name:'Disable sound',exact:true}).click();
  await expect(page.getByRole('button',{name:'Enable sound',exact:true})).toHaveAttribute('aria-pressed','false');
  const count=(await tones(page)).length;
  await page.locator('h1').click();await page.locator('[data-nav="skills"]').click();await expect(page).toHaveURL(/\/skills$/);
  expect((await tones(page)).length).toBe(count);
  await page.reload();await expect(page.getByRole('button',{name:'Enable sound',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>(window as unknown as {audioProbe:Probe}).audioProbe.contexts.length)).toBe(0);
  await page.getByRole('button',{name:'Enable sound',exact:true}).click();
  await expect.poll(()=>state(page)).toBe('running');
  await expect.poll(async()=>(await tones(page)).includes(660)).toBe(true);
});
