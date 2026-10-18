import {profile} from './content';
import {escapeHtml as e} from './utils';

/** The supplied photograph stays intact; the treatment and circuits are CSS/SVG. */
export function identityPortrait(compact=false){
  return `<div class="identity-portrait ${compact?'identity-portrait-compact':''}"><div class="portrait-halo"></div><div class="portrait-frame"><img src="${e(profile.portrait)}" alt="${e(profile.name)}" width="821" height="804" ${compact?'loading="lazy"':'fetchpriority="high"'}><span class="portrait-scan"></span><span class="portrait-cross cross-tl"></span><span class="portrait-cross cross-br"></span></div><span class="portrait-code" aria-hidden="true">SP / 001<span class="live-dot"></span></span></div>`;
}

export function heroIdentity(context='HUMAN AT THE CORE. CODE EVERYWHERE.'){
  return `<div class="hero-identity"><svg class="identity-circuit" viewBox="0 0 520 260" fill="none" aria-hidden="true"><g class="circuit-traces"><path d="M80 100H190L220 70H460V35H505"/><path d="M85 130H235L265 160H470V205H515"/><path d="M80 155V210H190L220 240H380"/><path d="M80 75V25H225L245 5H350"/></g><g class="circuit-packets"><path d="M80 100H190L220 70H460V35H505"/><path d="M85 130H235L265 160H470V205H515"/><path d="M80 155V210H190L220 240H380"/></g><g class="circuit-pins"><circle cx="505" cy="35" r="3"/><circle cx="515" cy="205" r="3"/><circle cx="380" cy="240" r="3"/><circle cx="350" cy="5" r="3"/></g></svg>${identityPortrait()}<div class="identity-copy"><span class="eyebrow"><span class="live-dot"></span> DEVELOPER / SYSTEMS THINKER</span><p class="identity-name">SHUBHANGAM<br><span>PANDEY<span class="accent">_</span></span></p><span class="identity-signal">${e(context)}</span></div></div>`;
}
