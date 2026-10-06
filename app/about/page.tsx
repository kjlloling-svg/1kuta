import type { Metadata } from 'next';
import Image from 'next/image';
import './photos.css';
export const metadata:Metadata={title:'About the Archive'};
const officials=[
  {
    "name": "Imelda A. Tangalin, DPM, PhD",
    "role": "Campus Director",
    "image": "/images/about/faculty/MAAM Imelda A. Tangalin, DPM, PhD.jpg"
  },
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
export default function About(){return <main id="main" className="page-main"><div className="wrap"><div className="page-intro"><p className="eyebrow">OUR PURPOSE</p><h1>About the archive</h1><p>A student developed system for the organization and discovery of research from Southern Luzon State University – Gumaca Campus.</p></div><div className="about-layout"><div><section className="prose-section"><h2>Built to keep research discoverable</h2><p>The Research Paper Compiler & Digital Archive provides a structured home for campus research papers. Its goal is to preserve research metadata, make papers easier to find across years and programs, and help students and faculty discover work related to their own studies.</p><p>The archive is designed for papers from 2009 onward. Records will be shown only after their details have been verified and added to the database. This is a student research project and should not be understood as an officially launched university service.</p></section><section className="prose-section"><h2>People named in the project brief</h2><p className="section-note">The following roles were supplied for this project. Confirm current appointments before an institutional launch.</p><div className="people-grid">{officials.map(({name,role,image})=><div className={`person-card ${role==='Campus Director'?'director-card':''}`} key={name}><picture className="person-photo-frame"><source srcSet={`${image.split('/').map(encodeURIComponent).join('/')}.webp`} type="image/webp" /><Image src={image} alt={`${name}, Faculty Member`} width={800} height={800} loading="lazy" className="person-photo" unoptimized /></picture><h3>{name}</h3><p>{role}</p></div>)}</div></section></div><aside className="about-aside"><p className="eyebrow">PROJECT TEAM</p><h2>Researchers & developers</h2>{team.map(({name,image})=><div className="team-row" key={name}><picture className="person-photo-frame"><source srcSet={`${image.split('/').map(encodeURIComponent).join('/')}.webp`} type="image/webp" /><Image src={image} alt={`${name}, Researcher`} width={800} height={800} loading="lazy" className="person-photo" unoptimized /></picture><strong>{name}</strong></div>)}</aside></div></div></main>}
