'use client';
import {departmentAccentFor} from '@/lib/departments';

import Link from '@/components/native-link';
import {useState} from 'react';
import {programFor} from '@/lib/programs';
import {CitationPanel} from './citation-panel';
import {LockedResearch} from './locked-research';
import {DetailActions} from './detail-actions';
export type PublicPaper={id:number;slug:string;title:string;authors:{name?:string;given:string;family:string;suffix?:string|null}[];year:number;program_id:string;program:string;abstract?:string|null;keywords:string[];status:'pending'|'verified'|'demo';department?:string|null;category?:string;created_at?:string;has_file?:boolean};
export function InteractivePaperCard({paper,onKeyword,admin=false,authenticated=false}:{paper:PublicPaper;authenticated?:boolean;admin?:boolean;onKeyword:(keyword:string)=>void}){
 const [expanded,setExpanded]=useState(false);const program=programFor(paper.program_id);
 return <article className={`paper-card interactive-card ${departmentAccentFor(paper.program_id).className}`}><div className="card-top"><span className={`tag ${departmentAccentFor(paper.program_id).className}`}>{`${program?.label||paper.program}${paper.status==='demo'?' · Demo record. Sample content only.':''}`}</span><span className="paper-year">{paper.year}</span></div><h3><Link href={`/research-papers/${encodeURIComponent(paper.slug)}`}>{paper.title}</Link></h3><p className="card-authors">{paper.authors.map(a=>`${a.given} ${a.family}${a.suffix?`, ${a.suffix}`:''}`.trim()).join(', ')||'Authors not recorded'}</p><div className="card-keywords">{paper.keywords.slice(0,4).map(k=><button className="keyword-chip" type="button" key={k} onClick={()=>onKeyword(k)}>{k}</button>)}{paper.keywords.length>4&&<button className="keyword-chip more-keywords" type="button" onClick={()=>onKeyword(paper.keywords[4])}>+{paper.keywords.length-4} more</button>}</div><div className="card-actions">{authenticated?<><button type="button" aria-expanded={expanded} aria-controls={`abstract-${paper.id}`} onClick={()=>setExpanded(!expanded)}>{expanded?'Hide abstract':'Read abstract'}</button><CitationPanel paperId={paper.id} slug={paper.slug}/></>:<LockedResearch slug={paper.slug}/>}</div>{authenticated&&expanded&&<section id={`abstract-${paper.id}`} className="card-abstract open"><h4>Abstract</h4><p>{paper.abstract||'No abstract is available for this record.'}</p></section>}{admin&&<DetailActions id={paper.id} slug={paper.slug} title={paper.title} hasFile={!!paper.has_file}/>}</article>;
}



