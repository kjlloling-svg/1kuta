'use client';

import { useState, useSyncExternalStore } from 'react';
import { programs } from '@/lib/programs';
import {departmentAccentFor} from '@/lib/departments';
import Link from './native-link';

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

export function ProgramMarquee() {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const staticMode = reducedMotion && !motionEnabled;
  return <section className="program-marquee" aria-label="Academic programs" data-paused={paused} data-motion={motionEnabled ? 'enabled' : undefined}>
    <div className="marquee-window"><div className="marquee-track" id="program-marquee-track">
      {[false,true].map(duplicate=><ul key={String(duplicate)} aria-hidden={duplicate||undefined} inert={duplicate||undefined}>{programs.map(p=><li key={p.slug} className={departmentAccentFor(p.slug).className}><Link href={`/research-papers?program=${p.slug}`} tabIndex={duplicate?-1:0}>{p.label}</Link><span aria-hidden="true">✦</span></li>)}</ul>)}
    </div></div>
    <button type="button" className="marquee-pause" aria-label={staticMode?'Play program strip':paused?'Resume program strip':'Pause program strip'} title={staticMode?'Your device prefers reduced motion. Play this strip if you wish.':undefined} aria-controls="program-marquee-track" aria-pressed={staticMode || paused} onClick={() => {
      if (staticMode) { setMotionEnabled(true); setPaused(false); }
      else setPaused(value => !value);
    }}>{staticMode ? 'Play' : paused ? 'Resume' : 'Pause'}</button>
  </section>;
}
