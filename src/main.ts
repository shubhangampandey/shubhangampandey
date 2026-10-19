import './fonts.css';
import './style.css';
import './effects.css';
import './enhancements.css';
import './identity.css';
import './contact.css';
import {heroIdentity} from './identity-view';
import {experiencePage} from './experience-view';
import {CyberEffects} from './effects';
import {skillsPage,skillInspector} from './skills-view';
import {projectCaseStudy} from './project-view';
import {createIcons,ArrowUpRight,ArrowRight,ArrowDown,Activity,Terminal,Command,AudioLines,Volume2,VolumeX,Maximize2,Minimize2,Minus,Pin,RotateCcw,Boxes,Network,Database,PanelsTopLeft,ChevronRight,ChevronDown,Check,Copy,ExternalLink,GitBranch,GitCommitHorizontal,Code2,FileText,Mail,GitFork,Braces,Link,Send,Menu,X,Search,Keyboard,Layers,Play,Pause,Download,BookOpen,Folder,ShieldCheck,Radio,CheckCheck,Map,Filter,Mouse,CornerDownLeft} from 'lucide';
import {profile,projects} from './content';
import type {ProjectScene} from './scene';
import {ActivityTerminal} from './terminal';
import {sound} from './audio';
import {escapeHtml as e,icon,clamp} from './utils';

const iconSet={ArrowUpRight,ArrowRight,ArrowDown,Activity,Terminal,Command,AudioLines,Volume2,VolumeX,Maximize2,Minimize2,Minus,Pin,RotateCcw,Boxes,Network,Database,PanelsTopLeft,ChevronRight,ChevronDown,Check,Copy,ExternalLink,GitBranch,GitCommitHorizontal,Code2,FileText,Mail,GitFork,Braces,Link,Send,Menu,X,Search,Keyboard,Layers,Play,Pause,Download,BookOpen,Folder,ShieldCheck,Radio,CheckCheck,Map,Filter,Mouse,CornerDownLeft};
const refreshIcons=()=>createIcons({icons:iconSet,attrs:{'stroke-width':1.5}});
const routes=[['home','Home'],['projects','Projects'],['experience','Experience'],['skills','Skills'],['linktree','Linktree'],['contact','Contact']];
const app=document.querySelector<HTMLDivElement>('#app')!;
let route='home',currentProject=projects[0],selectedLayer=2,scene:ProjectScene|undefined;
let savedMotion:string|null=null;
try{savedMotion=localStorage.getItem('orbital.effects.motion');}catch{/* Storage can be unavailable in private contexts. */}
// Effects start on for every new visitor; only an explicit choice in this version overrides it.
let motion=savedMotion!=='off';
let routeCleanup:(()=>void)[]=[];
let copiedTimer:number|undefined;

app.innerHTML=`<header class="site-header"><a class="brand" href="#/home" aria-label="${e(profile.name)} home"><span class="brand-mark">S<span></span></span><strong class="brand-name">SHUBHANGAM<span>PANDEY<span class="accent">_</span></span></strong><span class="brand-slash">/</span><span class="brand-role">SYSTEMS & CODE</span></a><nav class="desktop-nav" aria-label="Main navigation">${routes.map(([key,title],i)=>`<a href="#/${key}" data-nav="${key}"><span class="nav-number">0${i+1}</span>${title}</a>`).join('')}</nav><div class="header-tools"><button class="command-trigger icon-button" aria-label="Open command menu" data-action="commands">${icon('command')}<kbd>K</kbd></button><button class="sound-toggle" data-action="sound" aria-label="${sound.enabled?'Disable sound':'Enable sound'}" aria-pressed="${sound.enabled}">${icon('audio-lines')}<span>SFX <b>${sound.enabled?'ON':'OFF'}</b></span></button><button class="menu-toggle icon-button" data-action="menu" aria-label="Open navigation" aria-expanded="false">${icon('menu')}</button></div></header><nav class="mobile-nav" aria-label="Mobile navigation" hidden>${routes.map(([key,title],i)=>`<a href="#/${key}"><span>0${i+1}</span>${title}${icon('arrow-up-right')}</a>`).join('')}</nav><main id="main" tabindex="-1"></main><footer class="status-bar"><span><span class="live-dot"></span> ORBITAL<span class="status-slash">/</span>ENGINEERING PORTFOLIO</span><span class="status-middle">${icon('git-branch')} main <span class="status-muted">/ local session</span></span><div><button data-action="motion" class="status-button" aria-pressed="${motion}">MOTION <b>${motion?'ON':'OFF'}</b></button><button data-action="terminal" class="status-button">${icon('terminal')}<span>CONSOLE</span><kbd>~</kbd></button><span class="clock"></span></div></footer><div class="toast" role="status"></div><dialog class="command-menu"><div class="command-search">${icon('search')}<input aria-label="Search commands" placeholder="Where do you want to go?" autocomplete="off"><button class="icon-button" data-action="close-commands" aria-label="Close command menu">${icon('x')}</button></div><div class="command-results"></div><div class="command-foot">${icon('keyboard')} Navigate your workspace <span>ESC to close</span></div></dialog>`;
const main=document.querySelector<HTMLElement>('#main')!;
const terminal=new ActivityTerminal();
document.documentElement.classList.toggle('motion-off',!motion);
const effects=new CyberEffects(terminal.element,()=>motion,(command,result)=>log(command,result));

const pageIntro=(number:string,command:string,title:string,description:string,extra='')=>`<div class="page-intro"><div><div class="eyebrow"><span class="accent">${number}</span><span class="eyebrow-line"></span>${command}</div><h1>${title}</h1><p>${description}</p></div>${extra}</div>`;

const tags=(items:string[])=>items.map(t=>`<span class="tag">${e(t)}</span>`).join('');
const linkButton=(url:string,label:string,ic='arrow-up-right')=>url?`<a class="button button-quiet" href="${e(url)}" target="_blank" rel="noopener noreferrer">${label}${icon(ic)}</a>`:`<button class="button button-quiet" data-pending="${e(label)}">${label}${icon(ic)}</button>`;

function home(){
  return `<section class="home-hero"><div class="hero-copy">${heroIdentity()}<h1 class="hero-heading">BUILD.<br><span class="accent">INSPECT.</span><br>UNDERSTAND<span class="accent">.</span></h1><p class="hero-description">${e(profile.summary)}</p><div class="hero-actions"><a href="#/projects" class="button button-primary">Inspect projects${icon('arrow-up-right')}</a><a href="#/contact" class="button button-quiet">Let's connect${icon('arrow-right')}</a></div><div class="hero-index"><span>INTERFACE</span><span class="index-cross">+</span><span>SYSTEMS</span><span class="index-cross">+</span><span>CRAFT</span></div><div class="hero-terminal-space"><span class="terminal-caption">EVERY INTERACTION LEAVES A TRACE.</span><span class="terminal-caption muted">Watch the console. Explore the system.</span></div></div><div class="hero-visual"><div class="visual-heading"><span>${icon('boxes')} ${e(projects[0].name)} <span class="muted">/ ARCHITECTURE PREVIEW</span></span><span class="visual-live"><span class="live-dot"></span> INTERACTIVE</span></div><div id="hero-scene" class="hero-scene" aria-label="Interactive 3D software architecture"></div><div class="hero-scene-bottom"><span>${icon('mouse')} Hover to tilt</span><a href="#/projects">Unfold the architecture${icon('arrow-up-right')}</a></div><div class="connection-legend"><span><i class="legend-wire api"></i> REST API</span><span><i class="legend-wire event"></i> EVENT BUS</span><span><i class="legend-wire pipeline"></i> DATA PIPELINE</span></div></div><div class="hero-bottom"><span>SOFTWARE IS MORE THAN ITS SURFACE.</span><a href="#selected-work">SCROLL TO EXPLORE${icon('arrow-down')}</a><span class="mono">00 — 01</span></div></section><section class="home-work section-pad" id="selected-work"><div class="section-heading"><div><div class="eyebrow">01 / SELECTED SYSTEMS</div><h2>Under the hood<span class="accent">.</span></h2></div><p>Two working systems. One way to explore them.<br><span class="muted">Incident investigation. Deterministic agent security.</span></p></div><div class="project-grid real-project-grid">${projects.map((p,i)=>`<a class="project-tile" href="#/projects?project=${p.id}"><div class="project-tile-top"><span>0${i+1} / ${e(p.category.toUpperCase())}</span>${icon('arrow-up-right')}</div><div class="project-art art-${p.id}"><span></span><span></span><span></span><b>${p.name.slice(0,1)}</b></div><h3>${p.name}</h3><p>${e(p.description)}</p><div class="tile-tags">${tags(p.stack.slice(0,3))}</div><div class="project-tile-bottom"><span>4 LAYERS / ${p.layers.reduce((n,l)=>n+l.modules.length,0)} MODULES</span><span>INSPECT${icon('arrow-right')}</span></div></a>`).join('')}</div></section><section class="home-philosophy section-pad"><div class="eyebrow">02 / THE WAY I THINK</div><h2>Good software makes<br>complexity <span class="outline-text">understandable.</span></h2><div class="philosophy-bottom"><p>An interface is the beginning of the story. The boundaries, tradeoffs, and data flows tell the rest.</p><a class="text-link" href="#/experience">Explore the approach${icon('arrow-up-right')}</a></div></section><section class="home-cta section-pad"><span class="eyebrow">NEXT TRANSMISSION</span><a href="#/contact">LET'S BUILD SOMETHING<span>${icon('arrow-up-right')}</span></a><div>Thoughtful systems. Useful software. Details that matter.</div></section>`;
}
function projectsPage(){
  return `<section class="projects-page section-pad">${pageIntro('02','/ PROJECT EXPLORER','Nothing hidden<span class="accent">.</span>','Select a system. Unfold its architecture. Follow every connection.','<span class="sample-badge">LOCAL ENGINEERING BUILDS</span>')}<div class="project-workspace"><aside class="project-sidebar"><div class="small-label">SELECT SYSTEM <span>${String(projects.length).padStart(2,'0')}</span></div><div class="project-selector">${projects.map((p,i)=>`<button data-project="${p.id}" class="project-choice ${p.id===currentProject.id?'active':''}"><span>0${i+1}</span><span><strong>${p.name}</strong><small>${e(p.category)}</small></span>${icon('arrow-up-right')}</button>`).join('')}</div><div class="project-description"><span class="eyebrow">README.md</span><h2>${currentProject.name}</h2><p>${e(currentProject.description)}</p><div class="tile-tags">${tags(currentProject.stack)}</div><div class="project-destinations">${linkButton(currentProject.source,'Source','code-2')}${linkButton(currentProject.demo,'Live demo','external-link')}</div></div><div class="sidebar-foot">PROJECT ARCHITECTURE<br><span>Four responsibility groups. Explore the code paths.</span></div></aside><div class="architecture-column"><div class="architecture-toolbar"><div class="segmented" aria-label="Architecture view"><button data-view="exploded" class="active">${icon('layers')} Layers</button><button data-view="assembled">${icon('boxes')} Assembled</button></div><button class="icon-button" data-action="reset-scene" aria-label="Reset architecture view">${icon('rotate-ccw')}</button></div><div class="architecture-scroll"><div class="architecture-sticky"><div id="project-scene" class="inspect-scene" aria-label="Interactive project layers"></div><div class="expansion-controls"><span>ASSEMBLED</span><input id="depth" aria-label="Layer expansion" type="range" min="0" max="100" value="38"><output id="depth-value">38%</output><span>EXPANDED</span></div><div class="scene-instruction">${icon('mouse')} Scroll to separate. Select a layer to inspect.</div></div></div><div class="connection-legend"><span><i class="legend-wire api"></i> REST / REQUESTS</span><span><i class="legend-wire event"></i> ASYNC / EVENTS</span><span><i class="legend-wire pipeline"></i> DATA / PIPELINE</span></div></div><aside class="layer-inspector" id="layer-inspector"></aside></div><div class="architecture-readout"><span>${icon('braces')} INSPECTABLE BY DESIGN</span><p>Four responsibility groups explain the system. The expanded state brings each group into the reading plane; connection widths distinguish calls from persistence flows.</p><a class="text-link" href="#/skills">Map the capabilities${icon('arrow-up-right')}</a></div>${projectCaseStudy(currentProject)}</section>`;
}
function inspector(moduleName?:string){
  const l=currentProject.layers[selectedLayer],m=l.modules.find(m=>m.name===moduleName);
  return `<div class="inspector-title"><span class="accent">$</span> layer.${e(l.id)}${icon('max imize-2'.replace(' ',''))}</div><div class="inspector-block"><span class="small-label">RESPONSIBILITY</span><h3>${e(l.name)}</h3><p>${e(l.responsibility)}</p></div>${m?`<div class="inspector-block selected-module"><span class="small-label">SELECTED MODULE</span><h3>${e(m.name)}</h3><p>${e(m.description)}</p></div>`:''}<div class="inspector-block"><span class="small-label">SUBMODULES <b>/ ${String(l.modules.length).padStart(2,'0')}</b></span><div class="inspector-modules">${l.modules.map((m,i)=>`<button data-inspect-module="${e(m.name)}" class="${m.name===moduleName?'active':''}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${e(m.name)}</strong><small>${e(m.description)}</small></div></button>`).join('')}</div></div><div class="inspector-block"><span class="small-label">CONNECTIONS</span><div class="connection-detail"><span class="connection-direction">↘ INBOUND</span><p>${e(l.inbound)}</p></div><div class="connection-detail"><span class="connection-direction accent">↗ OUTBOUND</span><p>${e(l.outbound)}</p></div></div>`;
}
const links=[
  {key:'github',title:'GitHub',desc:'Source code & open work',category:'CODE',icon:'git-fork',url:profile.links.github},
  {key:'leetcode',title:'LeetCode',desc:'Problem solving & practice',category:'PRACTICE',icon:'code-2',url:profile.links.leetcode},
  {key:'codeforces',title:'Codeforces',desc:'Competitive programming',category:'PRACTICE',icon:'braces',url:profile.links.codeforces},
  {key:'resume',title:'Résumé',desc:'Experience & credentials',category:'DOCUMENT',icon:'file-text',url:profile.resume},
  {key:'certificates',title:'Certificates',desc:'Certifications & completed learning',category:'DOCUMENT',icon:'shield-check',url:profile.links.certificates},
  {key:'recommendation',title:'Recommendation Letter',desc:'Professional letter of recommendation',category:'DOCUMENT',icon:'file-text',url:profile.links.recommendation},
  {key:'linkedin',title:'LinkedIn',desc:'Professional profile',category:'PROFILE',icon:'link',url:profile.links.linkedin},
  {key:'blog',title:'Writing',desc:'Notes, decisions & experiments',category:'WRITING',icon:'book-open',url:profile.links.blog},
  {key:'email',title:'Email',desc:'Start a conversation',category:'CONTACT',icon:'mail',url:profile.email?`mailto:${profile.email}`:''},
  {key:'projects',title:'Projects',desc:'Explore the systems',category:'WORK',icon:'boxes',url:'#/projects'},
];
function linktreePage(){
  return `<section class="linktree-page section-pad">${pageIntro('05','/ PERSONAL DIRECTORY','All the right connections<span class="accent">.</span>','Code, practice, writing, and everything in between.')}<div class="directory-layout"><aside class="directory-profile directory-profile-text"><h2>${e(profile.name)}</h2><span class="role-label">${e(profile.role)}</span><p>One place for the work, the thinking, and the next conversation.</p><div class="directory-tree"><span>${icon('folder')} /shubhangam-pandey</span><span>├── code</span><span>├── practice</span><span>├── profile</span><span>└── documents</span></div><div class="sample-note">Code, credentials, and ways to connect.</div></aside><div class="directory-main"><div class="directory-topline"><span>${icon('link')} /links</span><span>${String(links.length).padStart(2,'0')} DESTINATIONS</span></div><div class="directory-links">${links.map((l,i)=>`${l.url?`<a href="${e(l.url)}" ${l.url.startsWith('#')||l.url.startsWith('mailto')?'':'target="_blank" rel="noopener noreferrer"'}`:`<button data-pending="${l.title}"`} class="directory-link" data-link-name="${l.key}"><span class="directory-index">${String(i+1).padStart(2,'0')}</span><span class="directory-icon">${icon(l.icon)}</span><span class="directory-name"><strong>${l.title}</strong><small>${l.desc}</small></span><span class="directory-category">${l.category}</span><span class="link-state">${l.url?'OPEN':'NOT LINKED'}</span>${icon(l.url?'arrow-up-right':'minus')}${l.url?'</a>':'</button>'}`).join('')}</div><section class="project-link-list" aria-label="Project repositories and live websites">${[...projects.map(project=>({name:project.name,source:project.source,demo:project.demo})),{name:"ORBITAL portfolio",...profile.links.projects.portfolio}].map(project=>`<div class="project-link-row"><strong>${e(project.name)}</strong>${linkButton(project.source,"GitHub repository","git-fork")}${linkButton(project.demo,"Live website","external-link")}</div>`).join("")}</section><div class="directory-foot"><span>Code is better when it's connected.</span><span>${icon('corner-down-left')} PICK A DESTINATION</span></div></div></div></section>`;
}
function contactPage(){
  return `<section class="contact-page section-pad">${pageIntro('06','/ OPEN A CHANNEL','Let’s make it happen<span class="accent">.</span>','A good conversation is where the next system starts.')}<div class="contact-layout"><div class="contact-copy"><div class="transmission"><div class="transmission-node">${icon('terminal')}<span>YOU</span><small>IDEA / QUESTION / PROJECT</small><span class="node-pin"></span></div><div class="transmission-cable"><span></span><span></span><i></i><small>OPEN CHANNEL</small></div><div class="transmission-node receiver">${icon('braces')}<span>${e(profile.name.toUpperCase())}</span><small>BUILD / THINK / COLLABORATE</small><span class="node-pin"></span></div></div><div class="contact-notes"><span class="eyebrow">GOOD SIGNALS</span><p>Interesting challenges.<br>Thoughtful collaboration.<br>Something that should exist.</p></div><div class="contact-links">${linkButton(profile.links.github,'GitHub','git-fork')}${linkButton(profile.links.linkedin,'LinkedIn','arrow-up-right')}</div></div><div class="contact-form-panel"><div class="form-topline"><span class="live-dot"></span> NEW TRANSMISSION <span>/ 001</span></div><form id="contact-form"><label for="contact-name">01 / YOUR NAME</label><input id="contact-name" name="name" placeholder="What should I call you?" autocomplete="name" required maxlength="120"><label for="contact-email">02 / EMAIL ADDRESS</label><input id="contact-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required maxlength="200"><label for="contact-message">03 / THE MESSAGE</label><textarea id="contact-message" name="message" rows="5" placeholder="Tell me about the idea, the challenge, or what you have in mind…" required minlength="10" maxlength="5000"></textarea><input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="contact-honeypot"><div class="form-submit"><button class="button button-primary" type="submit">Send message${icon('send')}</button><span>Delivered directly by email.</span></div><p class="form-feedback" role="status"></p></form><div class="form-foot">${icon('terminal')} Your email stays private and is used only to reply.</div></div></div></section>`;
}

function log(command:string,result?:string){terminal.log(command,result);}
function toast(message:string){const el=document.querySelector<HTMLElement>('.toast')!;el.textContent=message;el.classList.add('visible');clearTimeout(copiedTimer);copiedTimer=window.setTimeout(()=>el.classList.remove('visible'),3500);}
function updateInspector(module?:string){const host=document.querySelector('#layer-inspector');if(host){host.innerHTML=inspector(module);refreshIcons();}}
function inspectSkill(button:HTMLElement,mode:'preview'|'select'='preview'){
  const host=document.querySelector<HTMLElement>('#skill-inspector'),name=button.dataset.skill;
  if(!host||!name)return;
  if(mode==='select'&&innerWidth<760){button.closest('.capability-plane')?.after(host);host.classList.add('skill-inspector-inline');host.scrollIntoView({block:'start',behavior:motion?'smooth':'instant'});}
  if(host.dataset.skillName===name)return;
  host.dataset.skillName=name;
  document.querySelectorAll<HTMLElement>('[data-skill]').forEach(el=>{const active=el===button;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  host.innerHTML=skillInspector(name);refreshIcons();
  log(`capability.${mode} ${name}`,'purpose / applications / connected skills');sound.play(mode==='preview'?'tick':'select');
}
document.addEventListener('pointerover',event=>{const node=(event.target as HTMLElement).closest<HTMLElement>('[data-skill]');if(node)inspectSkill(node);});
document.addEventListener('focusin',event=>{const node=(event.target as HTMLElement).closest<HTMLElement>('[data-skill]');if(node)inspectSkill(node);});
function selectLayer(index:number,module?:string){selectedLayer=index;updateInspector(module);log(`inspect ${currentProject.id} --layer ${currentProject.layers[index].id}`,module?`module: ${module}`:`${currentProject.layers[index].modules.length} modules / responsibility mapped`);sound.play('select');}

async function setupScene(variant:'hero'|'inspect'){
  const host=document.querySelector<HTMLElement>(variant==='hero'?'#hero-scene':'#project-scene');if(!host)return;
  const controls=variant==='inspect'?Array.from(main.querySelectorAll<HTMLButtonElement|HTMLInputElement>('[data-view],#depth,[data-action="reset-scene"]')):[];
  controls.forEach(control=>control.disabled=true);host.setAttribute('aria-busy','true');
  const {ProjectScene}=await import('./scene');
  if(!host.isConnected)return;
  scene=new ProjectScene(host,{variant,project:variant==='hero'?projects[0]:currentProject,onSelect:(index,module)=>{
    if(variant==='hero'){log(`project.focus ${projects[0].id} --layer ${projects[0].layers[index].id}`,module?`module: ${module}`:'architecture selected');sound.play('select');}
    else selectLayer(index,module);
  },onHover:(index)=>{log(`layer.preview ${(variant==='hero'?projects[0]:currentProject).layers[index].id}`,'pointer focus / connected structure');},motion,onReady:()=>refreshIcons()});
  controls.forEach(control=>control.disabled=false);host.removeAttribute('aria-busy');
  if(variant==='inspect'){
    updateInspector();
    const input=document.querySelector<HTMLInputElement>('#depth')!,output=document.querySelector('#depth-value')!;
    let manual=false,lastMilestone=-1;
    const set=(value:number,fromScroll=false)=>{scene?.setExpansion(value);input.value=String(Math.round(value*100));output.textContent=`${Math.round(value*100)}%`;if(!fromScroll){manual=true;}};
    input.addEventListener('input',()=>set(Number(input.value)/100));
    input.addEventListener('change',()=>{log(`layers.expand --depth ${input.value}%`,'geometry updated / cables settled');sound.play('unfold');});
    const scroll=()=>{const region=document.querySelector<HTMLElement>('.architecture-scroll');if(!region||innerWidth<760||manual)return;const rect=region.getBoundingClientRect();const p=clamp((innerHeight*.4-rect.top)/Math.max(1,region.offsetHeight-innerHeight*.75));set(.38+p*.62,true);const milestone=Math.floor(p*3);if(milestone!==lastMilestone&&p>0){lastMilestone=milestone;log('architecture.unfold',`${Math.round((.38+p*.62)*100)}% expanded`);sound.play('unfold');}};
    addEventListener('scroll',scroll,{passive:true});routeCleanup.push(()=>removeEventListener('scroll',scroll));
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>{const expanded=b.dataset.view==='exploded';document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));set(expanded?1:0);log(`layers.${expanded?'expand':'assemble'}`,expanded?'all layers face the viewer':'assembly restored');sound.play('unfold');}));
    document.querySelector('[data-action="reset-scene"]')?.addEventListener('click',()=>{manual=false;set(.38,true);window.scrollTo({top:0,behavior:motion?'smooth':'instant'});log('architecture.reset','inspection restored');});
  }
}
function renderPage(){
  scene?.dispose();scene=undefined;routeCleanup.forEach(fn=>fn());routeCleanup=[];
  const [path,query]=(location.hash.slice(2)||'home').split('?');
  route=routes.some(([key])=>key===path)?path:'home';
  const projectId=new URLSearchParams(query).get('project');if(projectId)currentProject=projects.find(p=>p.id===projectId)||projects[0];
  selectedLayer=2;
  document.querySelectorAll('[data-nav]').forEach(el=>{el.classList.toggle('active',(el as HTMLElement).dataset.nav===route);if((el as HTMLElement).dataset.nav===route)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const titles:Record<string,string>={home:'Summary',projects:'Project explorer',experience:'Experience',skills:'Capabilities',linktree:'Link directory',contact:'Contact'};
  document.title=`${titles[route]} / ${profile.name.toUpperCase()}`;
  document.body.dataset.page=route;
  main.className='route-enter';main.innerHTML=({home,projects:projectsPage,experience:experiencePage,skills:skillsPage,linktree:linktreePage,contact:contactPage}[route]!)();
  if(route!=='home'){
    const intro=main.querySelector<HTMLElement>('.page-intro');
    if(intro){
      const copy=intro.firstElementChild!;
      // Keep each page's badge/count beside its introduction; share Home's portrait component.
      [...intro.children].slice(1).forEach(node=>{node.classList.add('page-context-badge');copy.append(node);});
      intro.classList.add('page-intro-with-identity');
      const identity=document.createElement('aside');identity.className='page-identity';
      identity.setAttribute('aria-label',`Shubhangam Pandey / ${titles[route]}`);
      identity.innerHTML=heroIdentity(`SCANNING / ${route.toUpperCase()} / ID: SP-001`);
      intro.append(identity);
    }
  }
  const mobileNav=document.querySelector<HTMLElement>('.mobile-nav')!;mobileNav.hidden=true;document.querySelector('[data-action="menu"]')!.setAttribute('aria-expanded','false');
  window.scrollTo({top:0,behavior:'instant'});
  if(route==='home')setupScene('hero');if(route==='projects')setupScene('inspect');
  if(route==='skills')document.querySelector('#skill-inspector')!.innerHTML=skillInspector();
  if(route==='contact')setupContact();
  refreshIcons();terminal.dock(route);log(`nav /${route}`,`${titles[route].toLowerCase()} ready`);sound.play('navigate');effects.route(route,main);
}
function setupContact(){
  const form=document.querySelector<HTMLFormElement>('#contact-form')!;
  form.addEventListener('focusin',ev=>{const target=ev.target as HTMLInputElement;log(`form.focus ${target.name}`,'input ready');});
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();if(!form.reportValidity())return;
    const data=new FormData(form),name=String(data.get('name')),email=String(data.get('email')),message=String(data.get('message'));
    const feedback=form.querySelector<HTMLElement>('.form-feedback')!;
    const button=form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    if(button.disabled)return;
    button.disabled=true;form.setAttribute('aria-busy','true');feedback.textContent='Sending your message…';
    try{
      const response=await fetch(import.meta.env.VITE_CONTACT_API_URL||'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message,website:String(data.get('website')||'')}),signal:AbortSignal.timeout(25000)});
      const result=await response.json().catch(()=>({error:'Email delivery is unavailable. Please try again later.'}));
      if(!response.ok||!result.ok)throw new Error(result.error||'Unable to send your message.');
      feedback.textContent='Message sent. Thank you — I’ll get back to you soon.';form.reset();log('contact.sent','message accepted by email server');sound.play('success');
    }catch(error){feedback.textContent=error instanceof Error&&error.name==='TimeoutError'?'Delivery timed out. Please try again later.':error instanceof Error?error.message:'Unable to send your message. Please try again.';}
    finally{button.disabled=false;form.removeAttribute('aria-busy');}
  });
}

const dialog=document.querySelector<HTMLDialogElement>('.command-menu')!;
const commandInput=dialog.querySelector<HTMLInputElement>('input')!;
function renderCommands(){
  const filter=commandInput.value.toLowerCase();
  const commands=[...routes.map(([key,title])=>({label:`Go to ${title}`,action:key,icon:'arrow-up-right'})),{label:'Toggle sound',action:'sound',icon:'audio-lines'},{label:'Toggle motion',action:'motion',icon:'activity'},{label:'Open activity terminal',action:'terminal',icon:'terminal'}].filter(c=>c.label.toLowerCase().includes(filter));
  dialog.querySelector('.command-results')!.innerHTML=commands.length?commands.map(c=>`<button data-command="${c.action}">${icon(c.icon)}${c.label}${icon('corner-down-left')}</button>`).join(''):'<p class="no-results">No matching command.</p>';refreshIcons();
}
commandInput.addEventListener('input',renderCommands);
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
async function action(name:string){
  if(name==='sound'){
    try{const on=await sound.toggle();document.querySelectorAll('.sound-toggle').forEach(el=>{el.setAttribute('aria-pressed',String(on));el.setAttribute('aria-label',on?'Disable sound':'Enable sound');el.querySelector('b')!.textContent=on?'ON':'OFF';});log(`audio.${on?'enable':'mute'}`,on?'synthesized interface cues active':'audio muted');}catch{toast('Audio is unavailable in this browser.');}
  }
  if(name==='motion'){motion=!motion;try{localStorage.setItem('orbital.effects.motion',motion?'on':'off');}catch{}document.documentElement.classList.toggle('motion-off',!motion);scene?.setMotion(motion);const button=document.querySelector('.status-bar [data-action="motion"]')!;button.setAttribute('aria-pressed',String(motion));button.querySelector('b')!.textContent=motion?'ON':'OFF';log(`motion.${motion?'enable':'reduce'}`,motion?'binary cursor / route transitions / scroll reveals active':'static inspection enabled');}
  if(name==='terminal'){terminal.open();}
  if(name==='menu'){const nav=document.querySelector<HTMLElement>('.mobile-nav')!;nav.hidden=!nav.hidden;document.querySelector('[data-action="menu"]')!.setAttribute('aria-expanded',String(!nav.hidden));}
  if(name==='commands'){commandInput.value='';renderCommands();dialog.showModal();commandInput.focus();log('command.open','navigation ready');}
  if(name==='close-commands')dialog.close();
}
// Unlock in the input gesture, before asynchronous routing or other click handlers run.
const unlockAudio=(event:Event)=>{
  if(!event.isTrusted)return;
  if(sound.enabled&&(event.target as Element)?.closest?.('[data-action="sound"]'))return;
  sound.unlock();
};
document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
document.addEventListener('click',event=>{
  if(!(event.target as Element)?.closest?.('[data-action="sound"]'))sound.play('click');
},{capture:true});
document.addEventListener('click',event=>{
  const target=event.target as HTMLElement;
  const sectionLink=target.closest<HTMLAnchorElement>('a[href="#selected-work"]');if(sectionLink){event.preventDefault();document.getElementById('selected-work')?.scrollIntoView({behavior:motion?'smooth':'instant',block:'start'});log('section.reveal selected-work','project index in view');return;}
  const actionButton=target.closest<HTMLElement>('[data-action]');if(actionButton)void action(actionButton.dataset.action!);
  const pending=target.closest<HTMLElement>('[data-pending]');if(pending){toast(`${pending.dataset.pending} is not connected yet.`);log(`link.pending ${pending.dataset.pending?.toLowerCase().replace(/\s/g,'-')}`,'destination not connected');}
  const project=target.closest<HTMLElement>('[data-project]');if(project){currentProject=projects.find(p=>p.id===project.dataset.project)!;location.hash=`/projects?project=${currentProject.id}`;log(`project.select ${currentProject.id}`,'architecture selected');sound.play('select');}
  const module=target.closest<HTMLElement>('[data-inspect-module]');if(module){scene?.select(selectedLayer,module.dataset.inspectModule);}
  const career=target.closest<HTMLElement>('[data-career]');if(career){const entry=career.closest('.career-entry')!;const open=!entry.classList.contains('open');entry.classList.toggle('open',open);career.setAttribute('aria-expanded',String(open));(entry.querySelector('.career-content') as HTMLElement).hidden=!open;log(`career.${open?'expand':'collapse'} ${Number(career.dataset.career)+1}`,open?'professional experience / remote':'record collapsed');sound.play('select');}
  const skill=target.closest<HTMLElement>('[data-skill]');if(skill)inspectSkill(skill,'select');
  const skillView=target.closest<HTMLElement>('[data-skill-view]');if(skillView){document.querySelector('.skills-map')!.classList.toggle('list-view',skillView.dataset.skillView==='list');document.querySelectorAll('[data-skill-view]').forEach(el=>el.classList.toggle('active',el===skillView));log(`capabilities.view ${skillView.dataset.skillView}`,'layout updated');}
  const command=target.closest<HTMLElement>('[data-command]');if(command){dialog.close();const key=command.dataset.command!;if(routes.some(([r])=>r===key))location.hash=`/${key}`;else void action(key);}
  const link=target.closest<HTMLAnchorElement>('.directory-link[href]');if(link){log(`link.open ${link.dataset.linkName}`,'destination selected');sound.play('select');}
});
let lastHover=0,lastHoverTarget:Element|null=null;
document.addEventListener('pointerover',ev=>{const target=(ev.target as HTMLElement).closest('button,a');if(!target||target===lastHoverTarget||target.closest('.activity-terminal'))return;lastHoverTarget=target;if(performance.now()-lastHover<250)return;lastHover=performance.now();sound.play('tick');if(target.matches('[data-nav],.project-tile,.directory-link,[data-project]'))log(`focus ${(target.getAttribute('data-nav')||target.getAttribute('data-project')||target.getAttribute('data-link-name')||'project')}`,'target acquired');});
addEventListener('keydown',ev=>{if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();void action('commands');}if(ev.key==='`'&&!(ev.target as HTMLElement).matches('input,textarea')){ev.preventDefault();terminal.open();}if(ev.key==='Escape'){const nav=document.querySelector<HTMLElement>('.mobile-nav')!;nav.hidden=true;document.querySelector('[data-action="menu"]')!.setAttribute('aria-expanded','false');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){sound.leaveTab();log('session.pause','browser tab in background');}else{sound.returnToTab();log('session.resume','interface focus restored');}});
addEventListener('blur',()=>sound.leaveTab());
addEventListener('focus',()=>sound.returnToTab());
addEventListener('hashchange',renderPage);
addEventListener('resize',()=>{if(innerWidth>=760){const host=document.querySelector<HTMLElement>('.skill-inspector-inline');if(host){document.querySelector('.skills-layout')?.append(host);host.classList.remove('skill-inspector-inline');}}});
const updateClock=()=>{document.querySelector('.clock')!.textContent=new Date().toLocaleTimeString('en-GB',{hour12:false});};updateClock();setInterval(updateClock,1000);
log('session.start','local interface session initialized');
log('renderer.prepare','3D layers / data connections');
log('input.listen','pointer / scroll / keyboard ready');
renderPage();
sound.initialize();
