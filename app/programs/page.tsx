import {departmentAccentFor} from '@/lib/departments';
import type { Metadata } from 'next';
import Link from '@/components/native-link';
import { programs } from '@/lib/programs';
export const metadata:Metadata={title:'Academic Programs'};
export default function Programs(){return <main id="main" className="page-main"><div className="wrap"><div className="page-intro"><p className="eyebrow">ACADEMIC PATHWAYS</p><h1>Programs in the archive</h1><p>Research is organized by program and, where applicable, its major. Select a program to explore its records.</p></div><div className="program-directory">{programs.map((p,i)=><Link href={`/research-papers?program=${p.slug}`} className={`directory-card ${departmentAccentFor(p.slug).className}`} key={p.slug}><span className="directory-index">0{i+1} / {String(programs.length).padStart(2,'0')}</span><h2>{p.name}</h2><p>{p.major?`Major in ${p.major}`:'Academic program'}</p><span className="directory-cta">View research <span aria-hidden="true">↗</span></span></Link>)}</div></div></main>}


