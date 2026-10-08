import {DesignMotion} from '@/components/design-motion';
import {ProgramMarquee} from '@/components/program-marquee';
import {departmentAccentFor} from '@/lib/departments';
import {HomeBackground} from '@/components/home-background';
import Link from '@/components/native-link';
import { recentPapers } from '@/lib/archive';
import { HomeSearch } from '@/components/home-search';
import { ArchiveStats } from '@/components/archive-stats';
import { PaperCard } from '@/components/paper-card';
import { DataError, EmptyPapers } from '@/components/data-state';
import { programs } from '@/lib/programs';
export const dynamic='force-dynamic';
export default async function Home() {
 let recent: Awaited<ReturnType<typeof recentPapers>>=[],failed=false;
 try { recent=await recentPapers(); } catch (e) { console.error('Archive home query failed',e); failed=true; }
 return <><DesignMotion/><HomeBackground/><main id="main"><section className="kuta-welcome" aria-labelledby="kuta-title"><div className="wrap welcome-layout"><div className="welcome-content"><p className="eyebrow">SLSU Gumaca · A space for curious minds</p><h1 id="kuta-title">KUTA<span className="wordmark-dot" aria-hidden="true">.</span></h1><p className="kuta-subtitle">Knowledge &amp; Universal<br className="wide-break"/> Technology Archive</p><p className="kuta-line">Welcome to KUTA. Explore, read, and share knowledge.</p><HomeSearch/><div className="welcome-actions"><Link className="button button-primary" href="/research-papers">Explore research <span aria-hidden="true">↗</span></Link><Link className="button button-outline" href="/programs">Browse programs</Link></div><p className="hero-note">Research from 2009–2026 · Organized for discovery</p></div><aside className="welcome-aside"><p className="eyebrow">From our campus, for curious minds</p><h2>Research, preserved.<br/><em>Discovery, made easier.</em></h2><p>Find campus research by title, author, program, and keyword. Read the abstracts and cite the ideas that move you forward.</p><div className="welcome-programs"><span>{programs.length} academic pathways</span><Link href="/programs" className="text-link">Find your field ↗</Link></div></aside></div><div className="wrap"><ArchiveStats/></div></section>
 <section className="section section-intro"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">FIND YOUR FIELD</p><h2>Explore by program</h2><p>{programs.length} academic pathways, one organized collection.</p></div><Link className="text-link" href="/programs">View all programs <span aria-hidden="true">↗</span></Link></div><div className="program-grid">{programs.map((p,i)=><Link className={`program-tile ${departmentAccentFor(p.slug).className}`} href={`/research-papers?program=${p.slug}`} key={p.slug}><svg className="program-symbol" aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v15h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3zM12 6v15"/></svg><span className="program-number">0{i+1}</span><strong>{p.label}</strong><span className="program-name">{p.name}{p.major?` · ${p.major}`:''}</span><span className="tile-arrow" aria-hidden="true">↗</span></Link>)}</div></div></section>
 <ProgramMarquee/>
 <section className="section how-it-works" aria-labelledby="how-title"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">A SIMPLE PATH TO DISCOVERY</p><h2 id="how-title">How it works</h2></div></div><ol className="how-steps"><li><span aria-hidden="true">01</span><h3>Search</h3><p>Find research by title, author, program, or keyword.</p></li><li><span aria-hidden="true">02</span><h3>Read the abstract</h3><p>Sign in with Google to read available research abstracts.</p></li><li><span aria-hidden="true">03</span><h3>Cite</h3><p>Sign in with Google to access the citation tools on a paper.</p></li></ol></div></section>
 <section className="section recent-section"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">LATEST IN THE COLLECTION</p><h2>Recently archived research</h2><p>Records are shown here after their metadata has been verified and added.</p></div></div>{failed?<DataError/>:recent.length?<div className="paper-grid">{recent.map(p=><PaperCard key={p.id} paper={p}/>)}</div>:<EmptyPapers/>}</div></section>
 <section className="purpose-band"><div className="wrap purpose-inner"><div><p className="eyebrow">ABOUT THE PROJECT</p><h2>A home for campus research, past and future.</h2></div><p>This digital archive is designed to make SLSU Gumaca research easier to organize, find, and reference. It is a student research project; publication of institutional records requires verification and authorization.</p><Link className="button button-light" href="/about">About the archive</Link></div></section></main></>;
}






