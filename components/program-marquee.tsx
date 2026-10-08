'use client';

import { useState } from 'react';
import { programs } from '@/lib/programs';
import {departmentAccentFor} from '@/lib/departments';
import Link from './native-link';

export function ProgramMarquee() {
  const [paused, setPaused] = useState(false);
  return <section className="program-marquee" aria-label="Academic programs" data-paused={paused}>
    <div className="marquee-window"><div className="marquee-track" id="program-marquee-track">
      {[false,true].map(duplicate=><ul key={String(duplicate)} aria-hidden={duplicate||undefined} inert={duplicate||undefined}>{programs.map(p=><li key={p.slug} className={departmentAccentFor(p.slug).className}><Link href={`/research-papers?program=${p.slug}`} tabIndex={duplicate?-1:0}>{p.label}</Link><span aria-hidden="true">✦</span></li>)}</ul>)}
    </div></div>
    <button type="button" className="marquee-pause" aria-label={paused?'Resume program strip':'Pause program strip'} aria-controls="program-marquee-track" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</button>
  </section>;
}
