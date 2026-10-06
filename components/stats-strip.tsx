'use client';
import {useEffect,useRef} from 'react';
type Counts={papers:number;years:number;authors:number};
export function StatsStrip({counts}:{counts:Counts|null}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!counts||!root.current||!('IntersectionObserver' in window))return;
  const numbers=[...root.current.querySelectorAll<HTMLElement>('[data-count]')],motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0;
  const finish=()=>{cancelAnimationFrame(frame);numbers.forEach(n=>n.textContent=n.dataset.count||'');};
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();if(motion.matches)return;
   const start=performance.now();
   const tick=(now:number)=>{const p=Math.min(1,(now-start)/600),ease=1-(1-p)**3;numbers.forEach(n=>n.textContent=String(Math.round(Number(n.dataset.count)*ease)));if(p<1)frame=requestAnimationFrame(tick);};
   frame=requestAnimationFrame(tick);
  },{threshold:.3});
  observer.observe(root.current);motion.addEventListener('change',finish);
  return()=>{observer.disconnect();finish();motion.removeEventListener('change',finish);};
 },[counts]);
 const rows:[keyof Counts,string][]=[['papers','Verified papers'],['years','Research years'],['authors','Researchers indexed']];
 if(!counts||counts.papers<=0)return null;
 return <div ref={root} className="stats-strip" aria-label="Live archive statistics">{rows.filter(([key])=>Number.isFinite(counts[key])&&counts[key]>0).map(([key,label])=><div key={key}><span className="sr-only">{counts[key]} {label}</span><strong aria-hidden="true" data-count={counts[key]} style={{minWidth:Math.max(2,String(counts[key]).length)+'ch'}}>{counts[key]}</strong><span aria-hidden="true">{label}</span></div>)}</div>;
}
