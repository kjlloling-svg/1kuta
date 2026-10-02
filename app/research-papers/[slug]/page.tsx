import {departmentAccentFor} from '@/lib/departments';
import {KeywordChips} from '@/components/keyword-chips';
import {LockedResearch} from '@/components/locked-research';
import {ResearchUnlocked} from '@/components/research-unlocked';
import type { Metadata } from 'next';
import Link from '@/components/native-link';
import { getPaper } from '@/lib/archive';
import { getCurrentUser } from '@/lib/auth';
import { programFor } from '@/lib/programs';
import { CitationPanel } from '@/components/citation-panel';
import { DetailActions } from '@/components/detail-actions';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const p=await getPaper((await params).slug);return {title:p?.title||'Research paper not found'};}
export default async function Detail({params}:{params:Promise<{slug:string}>}){
 const slug=(await params).slug,user=await getCurrentUser(),admin=user?.role==='admin',paper=await getPaper(slug,user?.role||'guest');
 if(!paper)return <main id="main" className="page-main wrap"><div className="state-card"><h1>Research paper not found</h1><Link href="/research-papers">Back to the archive</Link></div></main>;
 const prog=programFor(paper.program_slug);
 return <main id="main" className="page-main"><div className="wrap detail-wrap"><Link className="back-link" href="/research-papers">← Back to research papers</Link><article className={`detail-panel ${departmentAccentFor(paper.program_slug).className}`}><div className="detail-top"><span className={`tag ${departmentAccentFor(paper.program_slug).className}`}>{prog?.label||paper.program_name}</span><span>{paper.year}{paper.status==='demo'?' · Demo record. Sample content only.':''}</span></div><h1>{paper.title}</h1><p className="detail-byline">{paper.authors||'Authors not recorded'}</p><div className="detail-grid"><div className="detail-body">{user?<><ResearchUnlocked slug={paper.slug}/><h2>Abstract</h2><p>{paper.abstract||'No abstract is available for this record.'}</p></>:<LockedResearch slug={paper.slug}/>}{paper.keywords.length>0&&<><h2>Keywords</h2><KeywordChips keywords={paper.keywords} limit={30}/></>}{admin&&<DetailActions id={paper.id} slug={paper.slug} title={paper.title} hasFile={!!paper.file_name}/>}{user&&<section className="cite-section"><h2>Cite this research</h2><CitationPanel paperId={paper.id} slug={paper.slug}/></section>}</div><aside className="metadata"><h2>Record details</h2><dl><dt>Program</dt><dd>{prog?.label||paper.program_name}</dd><dt>Research year</dt><dd>{paper.year}</dd><dt>Authors</dt><dd>{paper.authors||'Not recorded'}</dd>{admin&&<><dt>Department / category</dt><dd>{paper.department||paper.paper_type}</dd><dt>Status</dt><dd>{paper.status}</dd></>}</dl></aside></div></article></div></main>;
}



