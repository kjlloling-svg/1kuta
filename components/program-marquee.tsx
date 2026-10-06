'use client';

import { useState } from 'react';
import { programs } from '@/lib/programs';

export function ProgramMarquee() {
  const [paused, setPaused] = useState(false);
  return <section className="program-marquee" aria-label="Academic programs" data-paused={paused}>
    <div className="marquee-window"><div className="marquee-track">
      <ul>{programs.map(p => <li key={p.slug}>{p.label}<span aria-hidden="true">✦</span></li>)}</ul>
      <ul aria-hidden="true">{programs.map(p => <li key={p.slug}>{p.label}<span>✦</span></li>)}</ul>
    </div></div>
    <button type="button" className="marquee-pause" aria-label="Pause program strip" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</button>
  </section>;
}
