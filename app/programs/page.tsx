import type {Metadata} from 'next';
import {programs} from '@/lib/programs';
import {database} from '@/lib/archive';
import {ProgramCard,type ProgramCardData} from '@/components/program-card';
import {ProgramMotion} from '@/components/program-motion';
import './programs.css';
export const metadata:Metadata={title:'Academic Programs'};
async function catalog():Promise<ProgramCardData[]>{
 try{
  // Read only: allPrograms() also seeds missing records, which this page must never do.
  const rows=await database().prepare("SELECT g.slug,g.name,g.major,COUNT(p.id) AS count FROM programs g LEFT JOIN research_papers p ON p.program_id=g.id AND p.status IN ('verified','demo') GROUP BY g.id,g.slug,g.name,g.major ORDER BY g.id").all<ProgramCardData>();
  if(!rows.results.length)return programs.map(p=>({slug:p.slug,name:p.name,major:p.major,count:null}));
  const order=new Map<string,number>(programs.map((p,i)=>[p.slug,i]));
  return rows.results.map(p=>({slug:String(p.slug),name:String(p.name),major:p.major==null?null:String(p.major),count:Number(p.count)})).sort((a,b)=>(order.get(a.slug)??programs.length)-(order.get(b.slug)??programs.length));
 }catch{return programs.map(p=>({slug:p.slug,name:p.name,major:p.major,count:null}));}
}
export default async function Programs(){const records=await catalog();return <main id="main" className="page-main programs-showcase"><ProgramMotion/><div className="programs-decoration" aria-hidden="true"/><div className="wrap"><div className="programs-intro"><p className="eyebrow">ACADEMIC PATHWAYS</p><h1>Programs in the archive</h1><p>Research is organized by program and, where applicable, its major. Select a program to explore its records.</p></div><div className="programs-section-progress" aria-hidden="true"><span/></div><div className="programs-showcase-grid">{records.map((p,i)=><ProgramCard key={p.slug} program={p} index={i}/>)}</div></div></main>;}
