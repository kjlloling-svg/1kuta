import type { Metadata } from 'next';
import Link from '@/components/native-link';
import { PersonPortrait } from '@/components/person-portrait';
import { stats } from '@/lib/archive';
import { AboutNavigation } from './about-navigation';
import './photos.css';

export const metadata: Metadata = { title: 'About the Archive' };
export const dynamic = 'force-dynamic';
const leadership=[
  {
    "name": "Frederick T. Villa, DTech",
    "role": "SLSU University President",
    "image": "/images/about/faculty/frederick-t-villa.jpg",
    "tier": "president"
  },
  {
    "name": "Imelda A. Tangalin",
    "role": "SLSU Gumaca Campus Director",
    "image": "/images/about/faculty/imelda-a-tangalin.jpg",
    "webp": "/images/about/faculty/imelda-a-tangalin.jpg.webp",
    "alt": "Imelda A. Tangalin, Campus Director",
    "tier": "director"
  }
] as const;
const officials=[
  {
    "name": "Harlene L. Dimailig",
    "role": "Program Chairperson, BSBA Human Resource Management",
    "image": "/images/about/faculty/MAAM Harlene L. Dimailig.jpg"
  },
  {
    "name": "Krish Bernadette P. Palay",
    "role": "Program Chairperson, BSEd Social Studies",
    "image": "/images/about/faculty/MAAM Krish Bernadette P. Palay.jpg"
  },
  {
    "name": "Ian Titus Ramones",
    "role": "Program Chairperson, BSIT-Computer Technology",
    "image": "/images/about/faculty/SIR Ian Titus Ramones.jpg"
  },
  {
    "name": "Kevo Riel U. Tarray",
    "role": "Program Chairperson, BSEd Math",
    "image": "/images/about/faculty/SIR Kevo Riel U. Tarray.jpg"
  },
  {
    "name": "Felisicimo E. Santiago",
    "role": "Research and Extension Coordinator",
    "image": "/images/about/faculty/SIR Felicisimo E. Santiago.jpg"
  },
  {
    "name": "Jhon Kenneth Aguado",
    "role": "SLSU Gumaca University Librarian"
  }
];
const team=[
  {
    "name": "Alfred James Reth Lutching Dionco",
    "role": "Researchers & developers",
    "image": "/images/about/researchers/RETH.jpg"
  },
  {
    "name": "Prince Laurel",
    "role": "Researchers & developers",
    "image": "/images/about/researchers/PRINCE.png"
  },
  {
    "name": "Kurt John Lenoel Loling",
    "role": "Researchers & developers",
    "image": "/images/about/researchers/KURT FORMAL.jpg"
  }
];

type Person = { name: string; role: string; image?: string; webp?: string; alt?: string; tier?: 'president' | 'director' };
function PersonCard({ person, researcher = false }: { person: Person; researcher?: boolean }) {
  const Heading = researcher ? 'h3' : 'h4';
  const webp = person.webp ?? (person.image && !person.tier ? `${person.image}.webp` : undefined);
  return <li className={`about-person${person.tier ? ` about-person-${person.tier}` : ''}`}>
    <PersonPortrait {...person} webp={webp} alt={person.alt ?? `${person.name}, ${researcher ? 'Researcher' : person.role}`} className="about-portrait" />
    <div className="about-person-copy"><Heading>{person.name}</Heading><p>{person.role}</p></div>
  </li>;
}
const values = [
  ['Preservation', 'Keep research records organized for future discovery.'],
  ['Accuracy', 'Check research details before marking a record as verified.'],
  ['Discovery', 'Help people find relevant work through clear search and filters.'],
  ['Clarity', 'Make available information and missing details easy to understand.'],
];
export default async function About() {
  let counts: Awaited<ReturnType<typeof stats>> | null = null;
  try { counts = await stats(); } catch { /* Unavailable counts must never appear as zero. */ }
  return <main id="main" className="about-page">
    <div className="about-content" id="about-top">
      <AboutNavigation />
      <section className="about-intro" aria-labelledby="about-title" data-about-section="intro">
        <p className="about-label">ABOUT KUTA</p>
        <h1 id="about-title">KUTA helps people find and preserve research from SLSU Gumaca.</h1>
        <p>A student-developed archive that brings campus research together in one searchable place.</p>
      </section>
      <section id="story" className="about-section" aria-labelledby="story-title" data-about-section="story">
        <p className="about-label">01 / OUR STORY</p>
        <h2 id="story-title">Research worth keeping. Easier to find.</h2>
        <p>Campus research is easier to use when people can find it. KUTA was created to organize research records by year, academic program, author, and keyword.</p>
        <p>Our aim is to help students and faculty discover earlier work and build on it. This is a student research project, rather than an officially launched university service.</p>
      </section>
      <section id="team" className="about-section" aria-labelledby="team-title" data-about-section="team">
        <p className="about-label">02 / THE PEOPLE</p>
        <h2 id="team-title">We, the Researchers</h2>
        <ul className="about-people about-researchers">{team.map(person => <PersonCard key={person.name} person={person} researcher />)}</ul>
        <h3 className="about-group-title" id="officials-title">Faculty &amp; Campus Officials</h3>
        <p className="about-note">Roles supplied for this project; current appointments should be confirmed before an institutional launch.</p>
        <ul className="about-people about-leadership" aria-labelledby="officials-title">{leadership.map(person => <PersonCard key={person.name} person={person} />)}</ul>
        <ul className="about-people about-faculty">{officials.map(person => <PersonCard key={person.name} person={person} />)}</ul>
      </section>
      <section id="archive-facts" className="about-section" aria-labelledby="facts-title" data-about-section="facts">
        <p className="about-label">03 / ARCHIVE FACTS</p>
        <h2 id="facts-title">The collection at a glance.</h2>
        {counts && counts.papers > 0 ? <>
          <dl className="about-facts">
            <div><dt>Verified papers</dt><dd>{counts.papers.toLocaleString('en-US')}</dd></div>
            <div><dt>Research years represented</dt><dd>{counts.years.toLocaleString('en-US')}</dd></div>
            <div><dt>Authors of verified papers</dt><dd>{counts.authors.toLocaleString('en-US')}</dd></div>
          </dl>
          <p className="about-note">Counts reflect verified records currently in the archive. Demo and pending records are excluded.{counts.papers === 0 ? ' No verified papers have been added yet.' : ''}</p>
        </> : counts && counts.papers === 0 ? <p className="about-note">The archive is being built. Verified research will appear here.</p> : <p className="about-note" role="status">Archive statistics are currently unavailable. Please check again later.</p>}
      </section>
      <section id="values" className="about-section" aria-labelledby="values-title" data-about-section="values">
        <p className="about-label">04 / OUR VALUES</p>
        <h2 id="values-title">What guides this project.</h2>
        <ol className="about-values">{values.map(([title,description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ol>
      </section>
      <section id="contact" className="about-section about-contact" aria-labelledby="contact-title" data-about-section="contact">
        <p className="about-label">05 / EXPLORE & CONTACT</p>
        <h2 id="contact-title">Explore the research.</h2>
        <p>Find papers by title, author, program, keyword, or year.</p>
        <div className="about-actions"><Link className="about-primary" href="/research-papers">Browse the archive <span aria-hidden="true">↗</span></Link><Link className="about-secondary" href="/faq">Read the FAQ</Link></div>
        <p className="about-note">Contact details coming soon.</p>
      </section>
      <a className="about-back" href="#about-top">Back to top ↑</a>
    </div>
  </main>;
}

