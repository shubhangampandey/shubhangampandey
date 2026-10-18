import type {Project} from './content';
import {escapeHtml as e,icon} from './utils';
export function projectCaseStudy(project:Project){
  return `<section class="project-case-study"><div class="section-heading"><div><div class="eyebrow">ENGINEERING NOTES / ${e(project.name.toUpperCase())}</div><h2>The decisions behind the system<span class="accent">.</span></h2></div></div><div class="case-study-grid"><article><span class="small-label">01 / THE PROBLEM</span><p>${e(project.problem)}</p></article><article><span class="small-label">02 / THE APPROACH</span><p>${e(project.approach)}</p></article></div><div class="case-study-details"><div><span class="small-label">IMPLEMENTED CAPABILITIES</span><ul>${project.highlights.map(item=>`<li>${icon('check')}${e(item)}</li>`).join('')}</ul></div><div><span class="small-label">VERIFICATION & SCOPE</span><p>${e(project.validation)}</p><p class="project-boundary">${e(project.boundary)}</p></div></div></section>`;
}
