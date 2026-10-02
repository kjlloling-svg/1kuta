import type { Metadata } from 'next';
import Link from '@/components/native-link';
export const metadata:Metadata={title:'Frequently Asked Questions'};
const questions=[
 ['What is this archive?','It is a student developed system designed to organize and help people discover research papers associated with SLSU Gumaca Campus. The archive currently displays only records that have been added and verified.'],
 ['What years does it cover?','The planned historical scope begins in 2009 and runs through 2026. The system can accommodate later years as new records become available.'],
 ['How do I search for a paper?','Open Research Papers, enter a title, author, keyword, program, or year, then apply the filters. Multiple filters can be combined.'],
 ['Why are there no results yet?','No paper records have been imported into the database. The interface deliberately avoids presenting sample or invented research as real campus work.'],
 ['What information does a record show?','When available, each record includes a title, authors, year, academic program, abstract, and keywords. Missing details are clearly marked.'],
 ['How are Nursing and Midwifery organized?','BS Nursing / Diploma in Midwifery is one course group in the archive. Papers from either former program are included in this merged filter.'],
 ['Can I download full papers?','Visitors and public accounts can read abstracts and basic metadata. Full-paper viewing, PDF downloads, and management are restricted to administrators.'],
];
export default function FAQ(){return <main id="main" className="page-main"><div className="wrap faq-wrap"><div className="page-intro"><p className="eyebrow">GOOD TO KNOW</p><h1>Frequently asked questions</h1><p>How the research archive works, what it contains, and how to find a record.</p></div><div className="faq-list">{questions.map(([q,a],i)=><details key={q}><summary><span>{String(i+1).padStart(2,'0')}</span>{q}<b aria-hidden="true">+</b></summary><p>{a}</p></details>)}</div><div className="faq-cta"><h2>Ready to explore?</h2><Link className="button button-primary" href="/research-papers">Search research papers</Link></div></div></main>}

