import type {CSSProperties} from 'react';
import Link from './native-link';
import {departmentAccentFor} from '@/lib/departments';
import {programIdentity} from './program-art';
export type ProgramCardData={slug:string;name:string;major:string|null;count:number|null};
export function ProgramCard({program,index}:{program:ProgramCardData;index:number}){
 const accent=departmentAccentFor(program.slug),{Art,code,discipline,learn}=programIdentity(program.slug);
 const label=program.major||discipline;
 const style={'--program-accent':`var(${accent.accentToken})`,'--program-tint':`var(${accent.tintToken})`,'--program-edge':`var(${accent.borderToken})`,'--program-text':`var(${accent.textToken})`,'--entry-order':index%3} as CSSProperties;
 return <Link href={`/research-papers?program=${encodeURIComponent(program.slug)}`} className="program-showcase-card" data-program={program.slug} style={style}>
  <div className="program-art-stage"><Art/><span className="program-spotlight" aria-hidden="true"/></div>
  <div className="program-card-copy"><h2 title={program.name}>{program.name}</h2><div className="program-card-meta"><span className="program-code">{code}</span><span className="program-discipline" title={label}>{label}</span></div><p className="program-learn" title={learn}>{learn}</p><p className="program-count">{program.count===null?'Paper count unavailable':program.count===0?'No papers yet — explore the archive':`${program.count} ${program.count===1?'paper':'papers'} in the archive`}</p><span className="program-explore">Explore papers <span aria-hidden="true">↗</span></span></div>
 </Link>;
}
