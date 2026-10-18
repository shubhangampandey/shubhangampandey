import {clamp} from './utils';

type Point={x:number;y:number};
type TrailBit=Point&{born:number;vx:number;vy:number;bit:string;white:boolean;};
type Fragment={angle:number;distance:number;bit:string;white:boolean;};
type ClickRing=Point&{born:number;variant:number;};

/** Visual-only effects. The overlay never receives or redirects pointer input. */
export class CyberEffects {
  readonly canvas=document.createElement('canvas');
  private ctx:CanvasRenderingContext2D|null;
  private hud=document.createElement('div');
  private progress=document.createElement('div');
  private shutter=document.createElement('div');
  private routeAnimation?:Animation;
  private shutterAnimation?:Animation;
  private observer?:IntersectionObserver;
  private resizeObserver:ResizeObserver;
  private width=innerWidth;private height=innerHeight;private dpr=1;
  private target:Point={x:0,y:0};private cursor:Point={x:0,y:0};
  private pointerVisible=false;private typing=false;private mouseDetected=false;
  private frame=0;private sequence=0;private lastTrail=0;private lastHover:Element|null=null;
  private fragments:Fragment[]=[];private trail:TrailBit[]=[];private rings:ClickRing[]=[];
  private burstAt=0;private clickPending=false;private linkedLogged=false;private phase='idle';
  private scanAt=-10000;private scrollEnergy=0;private lastScroll=scrollY;private lastScrollAt=0;
  private hudUntil=0;private terminalRect:DOMRect;

  constructor(private terminal:HTMLElement,private getMotion:()=>boolean,private log:(command:string,result?:string)=>void){
    this.canvas.className='binary-cursor-canvas';this.canvas.setAttribute('aria-hidden','true');this.canvas.dataset.phase='idle';
    this.ctx=this.canvas.getContext('2d');
    this.hud.className='cyber-event-hud';this.hud.setAttribute('aria-hidden','true');
    this.progress.className='cyber-scroll-progress';this.progress.setAttribute('aria-hidden','true');
    this.shutter.className='cyber-route-shutter';this.shutter.setAttribute('aria-hidden','true');
    document.body.append(this.canvas,this.hud,this.progress,this.shutter);this.terminalRect=terminal.getBoundingClientRect();
    this.resizeObserver=new ResizeObserver(()=>this.updateProgress());this.resizeObserver.observe(document.body);
    this.resize();this.syncMotion();
    document.addEventListener('pointermove',this.pointerMove,{passive:true});
    document.documentElement.addEventListener('pointerleave',this.pointerLeave);
    document.addEventListener('pointerover',this.pointerOver,{passive:true});
    document.addEventListener('click',this.click,{passive:true});
    addEventListener('scroll',this.scroll,{passive:true});
    addEventListener('resize',()=>{this.resize();this.syncMotion();});
    addEventListener('blur',this.pointerLeave);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.pointerLeave();cancelAnimationFrame(this.frame);this.frame=0;}else this.start();});
    new MutationObserver(()=>this.syncMotion()).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }

  private resize(){
    this.width=innerWidth;this.height=innerHeight;this.dpr=Math.min(devicePixelRatio||1,1.5);
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
    this.canvas.style.width=`${this.width}px`;this.canvas.style.height=`${this.height}px`;
    this.ctx?.setTransform(this.dpr,0,0,this.dpr,0,0);this.updateProgress();
  }
  // Actual mouse input is authoritative, including narrow desktop panels and hybrid devices.
  private pointerAllowed(){return this.mouseDetected&&this.getMotion()&&!!this.ctx;}
  private pointerMove=(event:PointerEvent)=>{
    if(event.pointerType==='touch'){this.pointerLeave();return;}
    this.mouseDetected=true;if(!this.pointerAllowed())return;
    const now=performance.now(),dx=event.clientX-this.target.x,dy=event.clientY-this.target.y;
    this.target={x:event.clientX,y:event.clientY};
    if(!this.pointerVisible){this.cursor={...this.target};this.burst(now,false);}
    this.pointerVisible=true;this.typing=(event.target as HTMLElement).matches('input,textarea,[contenteditable="true"]');
    document.body.classList.add('binary-cursor-enabled');
    if(now-this.lastTrail>18&&Math.hypot(dx,dy)>2){
      this.lastTrail=now;for(let i=0;i<3;i++)this.trail.push({x:this.cursor.x+(Math.random()-.5)*26,y:this.cursor.y+(Math.random()-.5)*26,born:now,vx:-dx*.025,vy:-dy*.025,bit:Math.random()>.5?'1':'0',white:Math.random()>.6});
      if(this.trail.length>72)this.trail.splice(0,this.trail.length-72);
    }
    this.start();
  };
  private pointerLeave=()=>{this.pointerVisible=false;document.body.classList.remove('binary-cursor-enabled');this.terminal.dataset.uplink='idle';};
  private pointerOver=(event:PointerEvent)=>{
    const target=(event.target as HTMLElement).closest<HTMLElement>('button,a,input,textarea');
    if(!target){this.lastHover=null;return;}
    if(target===this.lastHover||!this.getMotion())return;
    this.lastHover=target;
    const variant=this.sequence++%3;
    target.dataset.fxInteraction=String(variant);
    if(variant===0)target.animate([{boxShadow:'inset 0 0 0 1px #f0445900'},{boxShadow:'inset 4px 0 0 #ff6681, inset 0 0 24px #f0445922'},{boxShadow:'inset 0 0 0 1px #f0445900'}],{duration:580});
    else if(variant===1)target.animate([{backgroundPosition:'-200% 0',backgroundImage:'linear-gradient(110deg,transparent 35%,#f044592b 50%,transparent 65%)',backgroundSize:'200% 100%'},{backgroundPosition:'200% 0',backgroundImage:'linear-gradient(110deg,transparent 35%,#f044592b 50%,transparent 65%)',backgroundSize:'200% 100%'}],{duration:600});
    else target.animate([{filter:'brightness(1)'},{filter:'brightness(1.5)',boxShadow:'0 0 20px #f0445928'},{filter:'brightness(1)'}],{duration:420});
  };
  private click=(event:MouseEvent)=>{
    if(!this.getMotion())return;
    const target=(event.target as HTMLElement).closest<HTMLElement>('button,a,input,textarea,.layer-card,.capability-node')||(event.target as HTMLElement);
    if(!target)return;
    const rect=target.getBoundingClientRect();
    const point=event.detail?{x:event.clientX,y:event.clientY}:{x:rect.left+rect.width/2,y:rect.top+rect.height/2};
    const now=performance.now();
    this.rings.push({...point,born:now,variant:this.sequence++%3});if(this.rings.length>4)this.rings.shift();
    this.signal(['INPUT / DECOMPOSE','SIGNAL / REASSEMBLE','EXEC / UPLINK'][this.sequence%3]);
    if(this.pointerAllowed()&&event.detail){this.target=point;this.cursor={...point};this.pointerVisible=true;this.burst(now,true);this.log('pointer.decompose --binary','interaction captured / reassembling uplink');}
    this.start();
  };
  private burst(now:number,fromClick:boolean){
    this.burstAt=now;this.clickPending=fromClick;this.linkedLogged=false;this.phase='pending';
    this.fragments=Array.from({length:30},(_,i)=>({angle:i/30*Math.PI*2+(Math.random()-.5)*.28,distance:32+Math.random()*40,bit:Math.random()>.5?'1':'0',white:i%3===0}));
  }
  private scroll=()=>{
    this.updateProgress();if(!this.getMotion())return;
    const now=performance.now(),delta=scrollY-this.lastScroll;
    this.scrollEnergy=Math.min(1,Math.abs(delta)/70+.08);this.lastScroll=scrollY;this.scanAt=now;
    if(now-this.lastScrollAt>380&&Math.abs(delta)>8){this.lastScrollAt=now;this.signal(`SCROLL / ${delta>0?'ADVANCE':'REVERSE'} / ${Math.round(scrollY).toString().padStart(4,'0')}`);}
    this.start();
  };
  private updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;this.progress.style.transform=`scaleX(${max>0?clamp(scrollY/max):0})`;}
  private signal(text:string){this.hud.textContent=text;this.hud.classList.add('visible');this.hudUntil=performance.now()+1200;}

  route(name:string,root:HTMLElement){
    this.refresh(root);this.lastScroll=scrollY;this.updateProgress();
    if(!this.getMotion())return;
    this.scanAt=performance.now();this.scrollEnergy=.6;this.signal(`ROUTE / ${name.toUpperCase()} / SYNC`);
    const variant=this.sequence++%3;root.dataset.fxVariant=String(variant);
    this.routeAnimation?.cancel();this.shutterAnimation?.cancel();
    this.shutter.textContent=`/ ${name.toUpperCase()}  ·  SIGNAL ACQUIRED`;
    this.shutterAnimation=this.shutter.animate([{opacity:0,transform:'translateX(-35px)'},{opacity:1,transform:'translateX(0)',offset:.2},{opacity:1,offset:.65},{opacity:0,transform:'translateX(25px)'}],{duration:1050,easing:'cubic-bezier(.16,1,.3,1)'});
    this.routeAnimation=root.animate([{opacity:.15,translate:variant===1?'0 16px':'0 24px',filter:'brightness(1.35)'},{opacity:1,translate:'0 0',filter:'none'}],{duration:720,easing:'cubic-bezier(.16,1,.3,1)'});
    this.start();
  }
  refresh(root:HTMLElement){
    this.observer?.disconnect();
    const nodes=root.querySelectorAll<HTMLElement>('.hero-identity,.page-intro,.section-heading,.project-tile,.home-philosophy,.home-cta,.experience-metric,.practice-item,.career-entry,.capability-plane,.directory-link,.contact-form-panel,.case-study-grid article,.case-study-details');
    if(!this.getMotion()){nodes.forEach(node=>node.dataset.fxReveal='visible');return;}
    this.observer=new IntersectionObserver(entries=>{let i=0;for(const entry of entries){if(entry.isIntersecting){const node=entry.target as HTMLElement;node.style.setProperty('--reveal-delay',`${(i++%4)*75}ms`);node.dataset.fxReveal='visible';this.observer?.unobserve(node);}}},{threshold:.08,rootMargin:'0px 0px -15px 0px'});
    nodes.forEach(node=>{node.dataset.fxReveal='pending';this.observer!.observe(node);});
  }
  syncMotion(){
    const on=this.getMotion();this.canvas.hidden=!on;this.progress.classList.toggle('static-progress',!on);
    if(!this.pointerAllowed())this.pointerLeave();
    if(!on){cancelAnimationFrame(this.frame);this.frame=0;this.ctx?.clearRect(0,0,this.width,this.height);this.pointerLeave();this.hud.classList.remove('visible');this.routeAnimation?.cancel();this.shutterAnimation?.cancel();document.querySelectorAll<HTMLElement>('[data-fx-reveal]').forEach(node=>node.dataset.fxReveal='visible');}
    else {this.start();const root=document.querySelector<HTMLElement>('#main');if(root)this.refresh(root);}
  }
  private start(){if(!this.frame&&this.getMotion()&&!document.hidden&&this.ctx)this.frame=requestAnimationFrame(this.draw);}
  private draw=(now:number)=>{
    this.frame=0;const ctx=this.ctx;if(!ctx||!this.getMotion()||document.hidden)return;
    ctx.clearRect(0,0,this.width,this.height);
    if(now>this.hudUntil)this.hud.classList.remove('visible');
    if(this.pointerVisible&&this.pointerAllowed()){
      this.cursor.x+=(this.target.x-this.cursor.x)*.23;this.cursor.y+=(this.target.y-this.cursor.y)*.23;
      if(now-this.burstAt>2800)this.burst(now,false);
      const elapsed=now-this.burstAt;
      const phase=elapsed<300?'disassembled':elapsed<850?'reassembling':'linked';
      if(phase!==this.phase){this.phase=phase;this.canvas.dataset.phase=phase;this.terminal.dataset.uplink=phase;}
      if(phase==='linked'&&this.clickPending&&!this.linkedLogged){this.linkedLogged=true;this.log('pointer.reassemble','terminal uplink restored');}
      if(!this.typing||phase!=='linked'){
        if(phase==='linked')this.drawTether(ctx,now);
        this.drawCursor(ctx,now,elapsed,phase);
      }
      this.drawTrail(ctx,now);
    }
    this.rings=this.rings.filter(ring=>now-ring.born<550);
    for(const ring of this.rings)this.drawRing(ctx,ring,(now-ring.born)/550);
    const scanLife=(now-this.scanAt)/650;
    if(scanLife>=0&&scanLife<1){
      const y=scanLife*this.height;
      const alpha=(1-scanLife)*this.scrollEnergy;
      ctx.fillStyle=`rgba(240,68,89,${alpha*.42})`;ctx.fillRect(0,y,this.width,1);
      const wash=ctx.createLinearGradient(0,y-55,0,y);wash.addColorStop(0,'#f0445900');wash.addColorStop(1,`rgba(240,68,89,${alpha*.055})`);ctx.fillStyle=wash;ctx.fillRect(0,y-55,this.width,55);
      ctx.fillStyle=`rgba(255,128,152,${alpha*.85})`;ctx.fillRect(0,y-9,3,18);ctx.fillRect(this.width-3,y-9,3,18);
    }
    if(this.pointerVisible||this.rings.length||scanLife<1||now<this.hudUntil)this.start();
  };
  private drawTrail(ctx:CanvasRenderingContext2D,now:number){
    this.trail=this.trail.filter(bit=>now-bit.born<600);ctx.font='11px "JetBrains Mono",monospace';
    for(const bit of this.trail){const age=(now-bit.born)/600;ctx.globalAlpha=(1-age)*.85;ctx.fillStyle=bit.white?'#f6edf3':'#ff617b';ctx.fillText(bit.bit,bit.x+bit.vx*age*18,bit.y+bit.vy*age*18+age*9);}
    ctx.globalAlpha=1;
  }
  private drawCursor(ctx:CanvasRenderingContext2D,now:number,elapsed:number,phase:string){
    const {x,y}=this.cursor;
    if(phase!=='linked'){
      const u=phase==='disassembled'?clamp(elapsed/300):1-clamp((elapsed-300)/550);
      const spread=phase==='disassembled'?Math.sin(u*Math.PI/2):u*u;
      ctx.font='12px "JetBrains Mono",monospace';
      for(const fragment of this.fragments){const d=fragment.distance*spread,a=fragment.angle+now*.00022;ctx.globalAlpha=.25+.65*spread;ctx.fillStyle=fragment.white?'#eadfe5':'#f04459';ctx.fillText(fragment.bit,x+Math.cos(a)*d-3,y+Math.sin(a)*d+3);}
      ctx.globalAlpha=1;
    }
    if(phase==='linked'){ctx.font='9px "JetBrains Mono",monospace';for(let i=0;i<6;i++){const a=now*.0005+i*Math.PI/3;ctx.globalAlpha=.55;ctx.fillStyle=i%2?'#f9e5ee':'#ff617b';ctx.fillText(i%2?'1':'0',x+Math.cos(a)*22-3,y+Math.sin(a)*22+3);}ctx.globalAlpha=1;}
    const size=phase==='linked'?10:5;
    ctx.strokeStyle=phase==='linked'?'#f04459':'#c98192';ctx.lineWidth=1;
    ctx.beginPath();for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ctx.moveTo(x+sx*(size-4),y+sy*size);ctx.lineTo(x+sx*size,y+sy*size);ctx.lineTo(x+sx*size,y+sy*(size-4));}ctx.stroke();
    ctx.fillStyle='#f4e8ed';ctx.fillRect(x-1,y-1,2,2);
    ctx.globalAlpha=.55;ctx.strokeStyle='#8c5265';ctx.strokeRect(this.target.x-3,this.target.y-3,6,6);ctx.globalAlpha=1;
  }
  private drawTether(ctx:CanvasRenderingContext2D,now:number){
    this.terminalRect=this.terminal.getBoundingClientRect();const rect=this.terminalRect;
    if(rect.bottom<0||rect.top>this.height)return;
    const end={x:clamp(this.cursor.x,rect.left+15,rect.right-15),y:rect.top-1};
    const bendY=Math.min(this.cursor.y+28,rect.top-16);
    const points=[{x:this.cursor.x+8,y:this.cursor.y+10},{x:this.cursor.x+25,y:bendY},{x:end.x,y:bendY},end];
    ctx.save();ctx.globalAlpha=.58;ctx.strokeStyle='#ef6785';ctx.lineWidth=1.15;ctx.setLineDash([5,6]);ctx.lineDashOffset=-now*.025;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
    ctx.font='7px "JetBrains Mono",monospace';ctx.fillStyle='#f3a6ba';ctx.fillText('UPLINK / UI',Math.min(this.cursor.x+15,this.width-90),this.cursor.y-20);
    ctx.globalAlpha=.7;ctx.fillStyle='#f04459';ctx.fillRect(end.x-2,end.y-2,4,4);
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);
    let distance=((now*.00035)%1)*total;
    for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const u=lengths[i]?distance/lengths[i]:0;ctx.fillStyle='#ffe3eb';ctx.fillRect(points[i].x+(points[i+1].x-points[i].x)*u-1,points[i].y+(points[i+1].y-points[i].y)*u-1,2,2);break;}distance-=lengths[i];}
    ctx.restore();
  }
  private drawRing(ctx:CanvasRenderingContext2D,ring:ClickRing,age:number){
    const radius=8+age*34;ctx.save();ctx.globalAlpha=(1-age)*.5;ctx.strokeStyle=ring.variant===1?'#e8dce4':'#f04459';ctx.lineWidth=.8;
    ctx.translate(ring.x,ring.y);if(ring.variant===2)ctx.rotate(Math.PI/4);
    if(ring.variant===1){ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();}
    else{ctx.strokeRect(-radius,-radius,radius*2,radius*2);}
    ctx.restore();
  }
}
