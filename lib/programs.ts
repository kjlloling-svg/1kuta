export const programs = [
  { slug: 'bsba-hrdm', label: 'BSBA – HRDM', name: 'Bachelor of Science in Business Administration', major: 'Human Resource Development Management', tone: 'gold' },
  { slug: 'bs-nursing-midwifery', label: 'BS Nursing / Diploma in Midwifery', name: 'BS Nursing / Diploma in Midwifery', major: null, tone: 'rose' },
  { slug: 'bsit-computer-technology', label: 'BSIT – Computer Technology', name: 'Bachelor of Science in Industrial Technology', major: 'Computer Technology', tone: 'blue' },
  { slug: 'bsed-social-studies', label: 'BSEd – Social Studies', name: 'Bachelor of Secondary Education', major: 'Social Studies', tone: 'maroon' },
  { slug: 'bsed-mathematics', label: 'BSEd – Mathematics', name: 'Bachelor of Secondary Education', major: 'Mathematics', tone: 'green' },
] as const;
export function canonicalProgram(slug:string){return ['bs-nursing','diploma-midwifery'].includes(slug)?'bs-nursing-midwifery':slug;}
export function programFor(slug:string){return programs.find(p=>p.slug===canonicalProgram(slug));}

export type ProgramSlug=typeof programs[number]['slug'];
