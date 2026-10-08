import type {ProgramSlug} from './programs';
type DepartmentAccent={className:string;textToken:string;tintToken:string;borderToken:string;accentToken:string};
export const departmentAccents={
 'bsba-hrdm':{className:'gold',textToken:'--dept-gold-text',tintToken:'--dept-gold-tint',borderToken:'--dept-gold-edge',accentToken:'--dept-gold-accent'},
 'bs-nursing-midwifery':{className:'rose',textToken:'--dept-rose-text',tintToken:'--dept-rose-tint',borderToken:'--dept-rose-edge',accentToken:'--dept-rose-accent'},
 'bsit-computer-technology':{className:'blue',textToken:'--dept-blue-text',tintToken:'--dept-blue-tint',borderToken:'--dept-blue-edge',accentToken:'--dept-blue-accent'},
 'bsed-social-studies':{className:'maroon',textToken:'--dept-maroon-text',tintToken:'--dept-maroon-tint',borderToken:'--dept-maroon-edge',accentToken:'--dept-maroon-accent'},
 'bsed-mathematics':{className:'green',textToken:'--dept-green-text',tintToken:'--dept-green-tint',borderToken:'--dept-green-edge',accentToken:'--dept-green-accent'},
 'dit-computer-technology':{className:'blue',textToken:'--dept-blue-text',tintToken:'--dept-blue-tint',borderToken:'--dept-blue-edge',accentToken:'--dept-blue-accent'},
 'dit-mechanical-technology':{className:'blue',textToken:'--dept-blue-text',tintToken:'--dept-blue-tint',borderToken:'--dept-blue-edge',accentToken:'--dept-blue-accent'}
} satisfies Record<ProgramSlug,DepartmentAccent>;
const fallback:DepartmentAccent={className:'dept-fallback',textToken:'--muted',tintToken:'--soft',borderToken:'--line',accentToken:'--line'};
export function departmentAccentFor(slug:string):DepartmentAccent{return Object.hasOwn(departmentAccents,slug)?departmentAccents[slug as ProgramSlug]:fallback;}
