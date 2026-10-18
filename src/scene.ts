import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import type {Project} from './content';
import {clamp,escapeHtml as e,icon} from './utils';

interface SceneOptions {variant:'hero'|'inspect';project:Project;onSelect:(index:number,module?:string)=>void;onHover?:(index:number)=>void;onReady?:()=>void;motion:boolean;}
interface Wire {mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;curve:THREE.CatmullRomCurve3;from:number;to:number;radius:number;label:HTMLElement;particles:THREE.Mesh[];phase:number;}
export class ProjectScene {
  private camera=new THREE.PerspectiveCamera(42,1,.1,5000);
  private scene=new THREE.Scene();
  private cssScene=new THREE.Scene();
  private group=new THREE.Group();
  private cards:CSS3DObject[]=[];
  private wires:Wire[]=[];
  private renderer?:THREE.WebGLRenderer;
  private css?:CSS3DRenderer;
  private resizeObserver?:ResizeObserver;
  private visibilityObserver?:IntersectionObserver;
  private frame=0;private disposed=false;private visible=true;private selected=2;
  private expansion=.72;private targetExpansion=.72;private pointer=new THREE.Vector2();private easedPointer=new THREE.Vector2();
  private start=performance.now();private motion=true;private moving=false;private mobile=false;private lastFrame=0;
  private width=0;private height=0;
  private dirty=true;
  private handlers: (()=>void)[]=[];
  constructor(private host:HTMLElement,private options:SceneOptions){
    this.motion=options.motion;
    this.targetExpansion=options.variant==='hero'?1:.38;this.expansion=options.variant==='hero'&&this.motion?.08:this.targetExpansion;
    this.host.classList.add('project-scene');
    this.mobile=window.innerWidth<760;
    if(this.mobile){this.mobileView();return;}
    try{this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
    catch{this.mobileView();return;}
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.setClearColor(0,0);
    this.renderer.domElement.className='wire-canvas';
    this.renderer.domElement.setAttribute('aria-hidden','true');
    this.host.append(this.renderer.domElement);
    this.css=new CSS3DRenderer();this.css.domElement.className='card-renderer';this.host.append(this.css.domElement);
    this.cssScene.add(this.group);this.buildCards();this.buildWires();
    const move=(event:PointerEvent)=>{const rect=this.host.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1));if(this.options.variant==='hero'&&this.motion)this.targetExpansion=.86+clamp((this.pointer.x+1)/2)*.14;};
    const leave=()=>{this.pointer.set(0,0);if(this.options.variant==='hero')this.targetExpansion=1;};
    this.host.addEventListener('pointermove',move);this.host.addEventListener('pointerleave',leave);
    this.handlers.push(()=>{this.host.removeEventListener('pointermove',move);this.host.removeEventListener('pointerleave',leave);});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
    this.visibilityObserver=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible&&!this.frame)this.frame=requestAnimationFrame(this.animate);});
    this.visibilityObserver.observe(host);this.resize();this.frame=requestAnimationFrame(this.animate);options.onReady?.();
  }
  private cardMarkup(index:number){
    const l=this.options.project.layers[index];
    return `<div class="card-topline"><span>SYS.${String(index+1).padStart(2,'0')}</span><span class="card-led"></span></div>
      <button class="layer-title" aria-label="Inspect ${e(l.name)} layer"><span class="layer-number">0${index+1}</span><span>${e(l.name)}</span>${icon(l.icon)}</button>
      <div class="layer-meta"><span>${e(l.label)}</span><span>${l.modules.length} modules</span></div>
      <div class="layer-divider"></div><div class="module-list">${l.modules.map((m,i)=>`<button class="module-row" data-module="${e(m.name)}" aria-label="Inspect ${e(m.name)} module"><span class="module-dot"></span><span>${e(m.name)}</span><span class="module-code">${String(i+1).padStart(2,'0')}</span></button>`).join('')}</div>
      <p class="layer-responsibility">${e(l.responsibility)}</p><div class="layer-bottom"><span>${e(l.id.toUpperCase())}</span><span>⤴</span></div><span class="port port-left"></span><span class="port port-right"></span>`;
  }
  private buildCards(){
    this.options.project.layers.forEach((l,index)=>{
      const el=document.createElement('div');el.className=`layer-card ${this.options.variant==='inspect'?'layer-card-wide':''} ${index===this.selected?'is-selected':''}`;
      el.setAttribute('role','group');el.setAttribute('aria-label',`${l.name} layer, ${l.modules.length} modules`);el.innerHTML=this.cardMarkup(index);
      el.querySelector('.layer-title')!.addEventListener('click',()=>this.select(index));
      el.querySelectorAll<HTMLButtonElement>('[data-module]').forEach(button=>button.addEventListener('click',()=>this.select(index,button.dataset.module)));
      el.addEventListener('pointerenter',()=>{this.moving=true;this.options.onHover?.(index);});
      el.addEventListener('pointerleave',()=>{this.moving=false;});
      const object=new CSS3DObject(el);this.group.add(object);this.cards.push(object);
    });
  }
  private mobileView(){
    this.mobile=true;this.host.classList.add('scene-mobile');
    this.host.innerHTML=`<div class="mobile-stack-label"><span class="live-dot"></span> Architecture / touch to inspect</div>${this.options.project.layers.map((l,i)=>`<div class="mobile-layer ${i===2?'is-selected':''}"><button class="mobile-layer-heading" data-layer="${i}"><span class="layer-number">0${i+1}</span>${icon(l.icon)}<strong>${e(l.name)}</strong><span>${l.modules.length} modules</span>${icon('arrow-up-right')}</button><p>${e(l.responsibility)}</p><div class="mobile-modules">${l.modules.map(m=>`<button data-layer="${i}" data-module="${e(m.name)}">${e(m.name)}</button>`).join('')}</div></div>${i<3?`<div class="mobile-wire"><span></span><small>${['REST / JSON','Service calls','Data pipeline'][i]}</small></div>`:''}`).join('')}`;
    this.host.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach(button=>button.addEventListener('click',()=>this.select(Number(button.dataset.layer),button.dataset.module)));
    this.options.onReady?.();
  }
  private buildWires(){
    const specs=[{from:0,to:1,color:0xf14a5d,radius:1.35,text:'REST / API'},{from:1,to:2,color:0xe0dedc,radius:1.15,text:'Service calls'},{from:2,to:3,color:0xd72e49,radius:4.1,text:'Data pipeline'},{from:3,to:0,color:0xf1e8e8,radius:.9,text:'SSE / updates'}];
    specs.forEach((spec,index)=>{
      const geometry=new THREE.BufferGeometry();
      const segments=40,sides=6;
      geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((segments+1)*(sides+1)*3),3).setUsage(THREE.DynamicDrawUsage));
      const indices:number[]=[];
      for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
      geometry.setIndex(indices);
      const material=new THREE.MeshBasicMaterial({color:spec.color,transparent:true,opacity:spec.radius>3?.85:.65,side:THREE.DoubleSide});
      const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;this.scene.add(mesh);
      const label=document.createElement('span');label.className=`wire-label wire-label-${index}`;label.textContent=this.options.project.wireLabels[index]||spec.text;this.host.append(label);
      const particleGeometry=new THREE.SphereGeometry(spec.radius>3?3.4:2.7,6,6);
      const particleMaterial=new THREE.MeshBasicMaterial({color:spec.radius>3?0xff6e7f:spec.color});
      const particles=Array.from({length:3},()=>{const p=new THREE.Mesh(particleGeometry,particleMaterial);this.scene.add(p);return p;});
      this.wires.push({mesh,curve:new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]),...spec,label,particles,phase:index*.19});
    });
  }
  private resize(){
    if(!this.renderer||!this.css)return;
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    if(w===this.width&&h===this.height)return;this.width=w;this.height=h;this.dirty=true;
    this.camera.aspect=w/h;this.camera.position.z=Math.max(700,Math.max(680,1060/this.camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(21))));
    this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld(true);this.renderer.setSize(w,h);this.css.setSize(w,h);
  }
  private animate=(now:number)=>{
    this.frame=0;if(this.disposed||!this.visible)return;
    this.frame=requestAnimationFrame(this.animate);
    if(document.hidden||now-this.lastFrame<24)return;this.lastFrame=now;
    if(!this.motion&&!this.dirty)return;this.dirty=false;
    const t=Math.max(0,(now-this.start)/1000);
    const delta=this.targetExpansion-this.expansion;
    this.expansion=this.motion&&Math.abs(delta)>.001?this.expansion+delta*.13:this.targetExpansion;
    this.easedPointer.lerp(this.motion?this.pointer:new THREE.Vector2(),.055);
    const p=this.expansion, inspect=this.options.variant==='inspect';
    const tilt=inspect?1-clamp((p-.65)/.3):1;
    this.group.rotation.y=this.easedPointer.x*(inspect?.035:.09)*tilt;
    this.group.rotation.x=this.easedPointer.y*(inspect?.025:.05)*tilt;
    this.cards.forEach((card,i)=>{
      const closed=new THREE.Vector3((i-1.5)*17,(i-1.5)*7,(i-1.5)*45);
      let opened:THREE.Vector3;
      if(inspect)opened=new THREE.Vector3(i%2===0?-230:230,i<2?175:-175,0);
      else opened=new THREE.Vector3([-390,-130,130,390][i],[25,0,35,-5][i],[-60,0,90,-45][i]);
      card.position.copy(closed.lerp(opened,p));
      if(this.motion)card.position.y+=Math.sin(t*.6+i)*2.4*tilt;
      card.rotation.y=inspect?(.35*(1-p)*(i%2===0?1:-1)):[.32,.18,-.11,-.3][i]*(.4+p*.6);
      card.rotation.x=inspect?.1*(1-p):.015;
      card.rotation.z=inspect?0:[-.015,.01,-.012,.015][i];
    });
    this.cssScene.updateMatrixWorld(true);
    this.wires.forEach((wire,i)=>this.updateWire(wire,i,t));
    this.renderer!.render(this.scene,this.camera);this.css!.render(this.cssScene,this.camera);
  };
  private updateWire(wire:Wire,index:number,time:number){
    const wide=this.options.variant==='inspect',half=wide?175:108;
    const from=this.cards[wire.from],to=this.cards[wire.to];
    const a=from.localToWorld(new THREE.Vector3(index===3?-half:half,-45,2));
    const b=to.localToWorld(new THREE.Vector3(index===3?half:-half,-50,2));
    const gap=a.distanceTo(b),sag=Math.min(155,35+gap*.12);
    const sway=this.motion?Math.sin(time*1.05+index)*7*(this.moving?1.4:1):0;
    const c=a.clone().lerp(b,.34);c.y-=sag;c.z+=30+sway;
    const d=a.clone().lerp(b,.68);d.y-=sag+sway;d.z+=25-sway;
    wire.curve.points=[a,c,d,b];
    const attr=wire.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const up=new THREE.Vector3(0,0,1),normal=new THREE.Vector3(),binormal=new THREE.Vector3();
    for(let segment=0;segment<=40;segment++){
      const u=segment/40,point=wire.curve.getPoint(u),tangent=wire.curve.getTangent(u);
      normal.crossVectors(tangent,up).normalize();binormal.crossVectors(tangent,normal).normalize();
      for(let side=0;side<=6;side++){
        const angle=side/6*Math.PI*2,c=Math.cos(angle)*wire.radius,s=Math.sin(angle)*wire.radius;
        attr.setXYZ(segment*7+side,point.x+normal.x*c+binormal.x*s,point.y+normal.y*c+binormal.y*s,point.z+normal.z*c+binormal.z*s);
      }
    }
    attr.needsUpdate=true;
    wire.particles.forEach((particle,j)=>particle.position.copy(wire.curve.getPoint(((j/3+wire.phase+(this.motion?time*.12:0))%1+1)%1)));
    const labelPosition=wire.curve.getPoint(.55).project(this.camera);
    wire.label.style.left=`${(labelPosition.x+1)/2*this.host.clientWidth}px`;
    wire.label.style.top=`${(-labelPosition.y+1)/2*this.host.clientHeight+12}px`;
    wire.label.style.opacity=String(clamp((this.expansion-.27)*3));
  }
  setExpansion(value:number){this.targetExpansion=clamp(value);this.dirty=true;}
  setMotion(value:boolean){this.motion=value;this.dirty=true;}
  select(index:number,module?:string){
    this.selected=index;
    this.dirty=true;
    this.cards.forEach((card,i)=>card.element.classList.toggle('is-selected',i===index));
    this.host.querySelectorAll('.mobile-layer').forEach((el,i)=>el.classList.toggle('is-selected',i===index));
    this.options.onSelect(index,module);
  }
  dispose(){
    this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver?.disconnect();this.visibilityObserver?.disconnect();this.handlers.forEach(fn=>fn());
    this.wires.forEach(w=>{w.mesh.geometry.dispose();w.mesh.material.dispose();w.particles[0]?.geometry.dispose();w.particles[0]?.material && (w.particles[0].material as THREE.Material).dispose();});
    this.renderer?.dispose();this.host.replaceChildren();
  }
}
