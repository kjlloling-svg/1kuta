'use client';
import {useState} from 'react';
import {ArrowUpRight,FileText} from 'lucide-react';
import {FavoriteButton} from './favorite-button';
import {departmentAccentFor} from '@/lib/departments';
import Link from '@/components/native-link';
import {programFor} from '@/lib/programs';
import {CitationPanel} from './citation-panel';
import {LockedResearch} from './locked-research';
import {DetailActions} from './detail-actions';
import {KeywordChips} from './keyword-chips';
export type PublicPaper={id:number;slug:string;title:string;authors:{name?:string;given:string;family:string;suffix?:string|null}[];year:number;program_id:string;program:string;abstract?:string|null;keywords:string[];status:'pending'|'verified'|'demo';department?:string|null;category?:string;created_at?:string;has_file?:boolean;views?:number};
export function InteractivePaperCard({paper,onKeyword,admin=false,authenticated=false}:{paper:PublicPaper;authenticated?:boolean;admin?:boolean;onKeyword?:(keyword:string)=>void}){
 const [expanded,setExpanded]=useState(paper.abstract!==undefined),[expired,setExpired]=useState(false),[abstract,setAbstract]=useState<string|null>(paper.abstract??null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 async function readAbstract(){
  if(expanded){setExpanded(false);return;}
  setBusy(true);setNotice('');
  try{
   const response=await fetch('/api/research-papers/'+encodeURIComponent(paper.slug)+'/abstract',{credentials:'same-origin',cache:'no-store'});
   if(response.status===401||response.status===403){setExpired(true);setAbstract(null);return;}
   if(!response.ok)throw new Error('Unable to load the abstract. Please try again.');
   const data=await response.json() as {abstract:string|null};setAbstract(data.abstract);setExpanded(true);
  }catch{setNotice('Unable to load the abstract. Please try again.');}finally{setBusy(false);}
 }
 const program=programFor(paper.program_id),href='/research-papers/'+encodeURIComponent(paper.slug);
 const authors=paper.authors.map(a=>a.name||`${a.given} ${a.family}${a.suffix?`, ${a.suffix}`:''}`.trim()).join(', ')||'Authors not recorded';
 const allowed=authenticated&&!expired;
 return <article className={`paper-card interactive-card ${departmentAccentFor(paper.program_id).className}`}>
  <div className="card-top"><span className="tag" title={program?.label||paper.program}>{program?.label||paper.program}</span><span className="paper-year">{paper.year}</span></div>
  <h3><Link href={href} title={paper.title}>{paper.title}</Link></h3>
  <p className="card-authors" title={authors}>{authors}</p>
  <div className="card-metadata"><span>{paper.status==='demo'?'Demo · Sample content only':paper.status==='pending'?'Pending review':'Verified record'}</span>{paper.category&&<span title={paper.category}>{paper.category}</span>}{typeof paper.views==='number'&&Number.isFinite(paper.views)&&paper.views>=0&&<span>{Math.floor(paper.views).toLocaleString()} views</span>}</div>
  <div className="card-keywords-slot"><KeywordChips keywords={paper.keywords} limit={2} onKeyword={onKeyword}/></div>
  <div className="card-preview" id={`abstract-${paper.id}`} aria-busy={busy}>
   {allowed?<p className="card-excerpt">{busy?'Loading abstract…':notice|| (expanded?(abstract?.trim()||'No abstract is available for this record.'):'Select Preview abstract to read a short summary.')}</p>:<LockedResearch slug={paper.slug} compact/>}
  </div>
  <span className="sr-only" role="status">{notice}</span>
  {!admin&&paper.status==='verified'?<FavoriteButton slug={paper.slug} status={paper.status}/>:<div className="card-feedback-space" aria-hidden="true"/>}
  <footer className="card-bottom paper-card-actions">
   <Link className="paper-action paper-action-primary" href={href} aria-label={`View Paper: ${paper.title}`}>View Paper<ArrowUpRight aria-hidden="true" size={18}/></Link>
   {allowed&&<><button className="paper-action paper-action-icon" type="button" title={expanded?'Hide abstract preview':'Preview abstract'} aria-label={expanded?'Hide abstract preview':'Preview abstract'} aria-expanded={expanded} aria-controls={`abstract-${paper.id}`} aria-busy={busy} disabled={busy} onClick={()=>void readAbstract()}><FileText aria-hidden="true" size={18}/></button><CitationPanel paperId={paper.id} slug={paper.slug} compact/></>}
   {admin&&<DetailActions id={paper.id} slug={paper.slug} title={paper.title} hasFile={!!paper.has_file} compact/>}
  </footer>
 </article>;
}
