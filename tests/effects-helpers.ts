import type {Page} from '@playwright/test';

// Record the transient visual phase in the page, so a slow CI round trip cannot miss it.
export async function watchNextBinaryBurst(page:Page){
  await page.locator('.binary-cursor-canvas').evaluate(el=>{
    el.setAttribute('data-observed-burst','waiting');
    const observer=new MutationObserver(()=>{
      if(el.getAttribute('data-phase')==='disassembled'){
        el.setAttribute('data-observed-burst','disassembled');observer.disconnect();
      }
    });
    observer.observe(el,{attributes:true,attributeFilter:['data-phase']});
  });
}
