import {escapeHtml as e,icon,clamp} from './utils';
export class ActivityTerminal {
  readonly element:HTMLElement;
  private minimized=false;
  private customPosition=false;
  private count=0;
  constructor(){
    this.element=document.createElement('aside');this.element.className='activity-terminal';this.element.setAttribute('aria-label','Interactive activity terminal');
    this.element.innerHTML=`<div class="terminal-handle"><span class="terminal-status"></span><span>ACTIVITY<span class="terminal-mode"> / UI ONLY</span></span><span class="terminal-preview"></span><div class="terminal-actions"><button data-terminal="clear" aria-label="Clear activity log">${icon('rotate-ccw')}</button><button data-terminal="dock" aria-label="Reset terminal position">${icon('pin')}</button><button data-terminal="minimize" aria-label="Minimize activity terminal">${icon('minus')}</button></div></div><div class="terminal-body"><div class="terminal-log" role="log" aria-label="Recent interface events"></div><div class="terminal-prompt"><span>❯</span><span class="terminal-cursor"></span><span class="terminal-hint">interface events / no shell access</span></div></div><div class="terminal-tail"><span>LOCAL SESSION</span><span class="terminal-counter">000 EVENTS</span></div>`;
    document.body.append(this.element);this.setMinimized(this.minimized);
    this.element.querySelectorAll<HTMLButtonElement>('[data-terminal]').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.terminal==='minimize')this.setMinimized(!this.minimized);
      if(button.dataset.terminal==='clear'){this.element.querySelector('.terminal-log')!.replaceChildren();this.log('terminal.clear','buffer reset');}
      if(button.dataset.terminal==='dock'){this.customPosition=false;this.element.style.left='';this.element.style.top='';this.element.classList.remove('is-dragged');this.log('terminal.dock','position restored');}
    }));
    const handle=this.element.querySelector<HTMLElement>('.terminal-handle')!;
    handle.addEventListener('pointerdown',event=>{
      if((event.target as HTMLElement).closest('button')||innerWidth<760)return;
      const rect=this.element.getBoundingClientRect(),dx=event.clientX-rect.left,dy=event.clientY-rect.top;
      handle.setPointerCapture(event.pointerId);this.element.classList.add('is-dragging','is-dragged');this.customPosition=true;
      const move=(ev:PointerEvent)=>{this.element.style.left=`${clamp(ev.clientX-dx,8,innerWidth-this.element.offsetWidth-8)}px`;this.element.style.top=`${clamp(ev.clientY-dy,80,innerHeight-this.element.offsetHeight-35)}px`;};
      const up=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);this.element.classList.remove('is-dragging');};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);
    });
    addEventListener('resize',()=>{if(this.customPosition){this.customPosition=false;this.element.style.left='';this.element.style.top='';this.element.classList.remove('is-dragged');}});
  }
  log(command:string,result?:string){
    const log=this.element.querySelector('.terminal-log')!;const line=document.createElement('div');line.className='terminal-entry';
    const time=new Date().toLocaleTimeString('en-GB',{hour12:false});
    line.innerHTML=`<span class="log-time">${time}</span><span class="log-command"><b>$</b> ${e(command)}</span>${result?`<span class="log-result"><span>↳</span> ${e(result)}</span>`:''}`;
    log.append(line);while(log.children.length>3)log.firstElementChild?.remove();log.scrollTop=log.scrollHeight;
    this.count++;this.element.querySelector('.terminal-counter')!.textContent=`${String(this.count).padStart(3,'0')} EVENTS`;
    this.element.querySelector('.terminal-preview')!.textContent=`$ ${command}`;
    if(!document.documentElement.classList.contains('motion-off'))this.element.querySelector('.terminal-status')!.animate([{opacity:1},{opacity:.15},{opacity:1}],{duration:300});
  }
  dock(route:string){
    const before=this.element.getBoundingClientRect();
    this.element.dataset.route=route;
    if(this.customPosition)return;
    // Navigation and browser focus never change the user's expanded/minimized state.
    const after=this.element.getBoundingClientRect();
    if((before.left!==after.left||before.top!==after.top)&&!document.documentElement.classList.contains('motion-off'))this.element.animate([{transform:`translate(${before.left-after.left}px,${before.top-after.top}px)`},{transform:'translate(0,0)'}],{duration:650,easing:'cubic-bezier(.19,1,.22,1)'});
  }
  open(){this.setMinimized(false);}
  private setMinimized(value:boolean){this.minimized=value;this.element.classList.toggle('is-minimized',value);const button=this.element.querySelector('[data-terminal="minimize"]')!;button.setAttribute('aria-label',value?'Expand activity terminal':'Minimize activity terminal');button.setAttribute('aria-expanded',String(!value));}
}
