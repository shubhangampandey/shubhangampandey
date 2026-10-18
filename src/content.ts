import {personalLinks} from './personal-links';
/** Personal details. Connect every destination in personal-links.ts. */
export const profile = {
  name: 'Shubhangam Pandey',
  portrait: '/images/shubhangam-pandey.png',
  role: 'Developer / systems thinker',
  headline: 'Engineering the unseen.',
  summary: 'I build software from the interface to the infrastructure. Explore the layers, inspect the decisions, and follow the data.',
  email: personalLinks.email,
  resume: personalLinks.resume,
  links: personalLinks,
};

export interface Layer {
  id: string; name: string; label: string; icon: string; responsibility: string;
  modules: { name: string; description: string }[];
  inbound: string; outbound: string;
}
export interface Project {
  id: string; name: string; category: string; description: string; stack: string[];
  source: string; demo: string; layers: Layer[];
  problem:string; approach:string; highlights:string[]; boundary:string; validation:string;
  wireLabels:[string,string,string,string];
}
export {projects} from './projects';
export {skills,findSkill,type Skill} from './skills';

export const experience = [
  {title:'Technical Team Lead Intern',place:'UDRcraft Private Limited',date:'09/2025 – 07/2026',location:'Remote',tag:'01 / TECHNICAL LEADERSHIP',start:'2025-09',end:'2026-07',bullets:[
    'Spearheaded Agile delivery across 4+ production modules, accelerating release cycles by 40%.',
    'Architected cloud deployment pipelines, improving system uptime to 99.9% and platform performance by 45%.',
    'Optimized CI/CD workflows, reducing deployment time by 30%.',
  ]},
  {title:'Software Engineer Intern',place:'Prodigy InfoTech Private Limited',date:'01/2026 – 02/2026',location:'Remote',tag:'02 / SOFTWARE ENGINEERING',start:'2026-01',end:'2026-02',bullets:[]},
];

