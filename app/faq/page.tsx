import type { Metadata } from 'next';
import Link from '@/components/native-link';
import {FIRST_RESEARCH_YEAR,currentResearchYear} from '@/lib/record-validation';
export const metadata:Metadata={title:'Frequently Asked Questions'};
const questions=[
 ['What is this archive?','KUTA is a student-developed archive for research from SLSU Gumaca Campus. It displays verified records and clearly labeled demos.'],
 ['What years does it cover?',`You can browse records from ${FIRST_RESEARCH_YEAR} through ${currentResearchYear()}. Some years may have no verified records yet.`],
 ['How do I search for a paper?','Open Research Papers. Search by title, author, or keyword, or choose a program and year. You can combine filters.'],
 ['Why don’t I see any results?','Try clearing filters or searching for a broader term. New records become public once they are verified.'],
 ['What information does a record show?','When available, each record includes a title, authors, year, academic program, abstract, and keywords. Missing details are clearly marked.'],
 ['How are Nursing and Midwifery organized?','BS Nursing / Diploma in Midwifery is one course group in the archive. Papers from either former program are included in this merged filter.'],
 ['Can I download full papers?','Guests can browse paper details. Readers who sign in with a KUTA account registered to an SLSU email address can read abstracts and cite papers. Only administrators can view full papers, download PDFs, or manage records.'],
];
export default function FAQ(){return <main id="main" className="page-main"><div className="wrap faq-wrap"><div className="page-intro"><p className="eyebrow">GOOD TO KNOW</p><h1>Frequently asked questions</h1><p>How the research archive works, what it contains, and how to find a record.</p></div><div className="faq-list">{questions.map(([q,a],i)=><details key={q}><summary><span>{String(i+1).padStart(2,'0')}</span>{q}<b aria-hidden="true">+</b></summary><p>{a}</p></details>)}</div><div className="faq-cta"><h2>Ready to explore?</h2><Link className="button button-primary" href="/research-papers">Search research papers</Link></div></div></main>}

