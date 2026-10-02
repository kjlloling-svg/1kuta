'use client';
import {useEffect,useRef,type ReactNode} from 'react';

/** Layout/data stay on the server; only reveal and decorative digits are enhanced. */
export function YearMotion({children}:{children:ReactNode}){
 const root=useRef<HTMLUListElement>(null);
 useEffect(()=>{
  const list=root.current;if(!list)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)'),items=[...list.querySelectorAll<HTMLElement>('.year-item')],frames=new Set<number>();
  const finish=()=>{observer?.disconnect();frames.forEach(cancelAnimationFrame);frames.clear();delete list.dataset.yearMotion;items.forEach(item=>{item.classList.add('is-visible');item.querySelectorAll<HTMLElement>('[data-year-count]').forEach(n=>n.textContent=n.dataset.yearCount||'0');});};
  const animate=(item:HTMLElement)=>{
   item.classList.add('is-visible');
   const numbers=[...item.querySelectorAll<HTMLElement>('[data-year-count]')],start=performance.now();
   const tick=(now:number)=>{const p=Math.min(1,(now-start)/650);numbers.forEach(n=>n.textContent=String(Math.round(Number(n.dataset.yearCount)*(1-(1-p)**3))));if(p<1){const frame=requestAnimationFrame(time=>{frames.delete(frame);tick(time);});frames.add(frame);}};
   if(numbers.length)tick(start);
  };
  if(media.matches||!('IntersectionObserver' in window))return;
  // Items are visible without JS. Enhancement cannot leave inaccessible links hidden.
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){animate(entry.target as HTMLElement);observer.unobserve(entry.target);}});},{threshold:.08});
  items.forEach(item=>observer!.observe(item));list.dataset.yearMotion='ready';
  const change=()=>{if(media.matches)finish();};media.addEventListener('change',change);
  const focus=(event:FocusEvent)=>{const item=(event.target as HTMLElement).closest<HTMLElement>('.year-item');if(item&&!item.classList.contains('is-visible')){observer?.unobserve(item);item.classList.add('is-visible');}};
  list.addEventListener('focusin',focus);
  return()=>{finish();media.removeEventListener('change',change);list.removeEventListener('focusin',focus);};
 },[]);
 return <ul ref={root} className="year-bento">{children}</ul>;
}
