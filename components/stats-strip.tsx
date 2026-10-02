'use client';
import {useEffect,useRef} from 'react';
type Counts={papers:number;years:number;authors:number};
export function StatsStrip({counts}:{counts:Counts|null}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!counts||!root.current)return;
  const el=root.current,numbers=[...el.querySelectorAll<HTMLElement>('[data-count]')];let frame=0,started=false;
  const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting)||started)return;started=true;observer.disconnect();if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const start=performance.now();const tick=(now:number)=>{const p=Math.min(1,(now-start)/850),ease=1-(1-p)**3;numbers.forEach(n=>n.textContent=String(Math.round(Number(n.dataset.count)*ease)));if(p<1)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
  },{threshold:.3});observer.observe(el);return()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[counts]);
 const rows:[keyof Counts,string][]=[['papers','Verified papers'],['years','Research years'],['authors','Researchers indexed']];
 return <div ref={root} className="stats-strip" aria-label="Live archive statistics">{rows.map(([key,label])=><div key={key}><span className="sr-only">{counts?counts[key]:'Unavailable'} {label}</span><strong aria-hidden="true" data-count={counts?.[key]} style={{minWidth:Math.max(2,String(counts?.[key]??0).length)+'ch'}} >{counts?counts[key]:'—'}</strong><span aria-hidden="true">{label}</span></div>)}</div>;
}
