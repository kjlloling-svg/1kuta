'use client';
import {useEffect} from 'react';
/** Content stays visible until entry; failed JavaScript never hides a section. */
export function DesignMotion(){
 useEffect(()=>{
  if(!('IntersectionObserver' in window))return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sections=[...document.querySelectorAll<HTMLElement>('.section-intro,.year-section,.recent-section,.purpose-band,.how-it-works,.stats-strip')];
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){if(!motion.matches)entry.target.classList.add('campus-reveal');observer.unobserve(entry.target);}});},{threshold:.08});
  sections.forEach(section=>observer.observe(section));
  const stop=()=>{if(motion.matches)sections.forEach(section=>section.classList.remove('campus-reveal'));};
  motion.addEventListener('change',stop);
  return()=>{observer.disconnect();motion.removeEventListener('change',stop);sections.forEach(section=>section.classList.remove('campus-reveal'));};
 },[]);
 return null;
}
