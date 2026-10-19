'use client';
import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
/** Geometry is cached on resize/content changes; scrolling only updates a transform. */
export function ScrollProgress(){
 const root=useRef<HTMLDivElement>(null),fill=useRef<HTMLSpanElement>(null),path=usePathname();
 const paper=path.startsWith('/research-papers/');
 useEffect(()=>{
  let frame=0,measureFrame=0,start=0,maximum=0;
  const update=()=>{frame=0;const progress=maximum>0?Math.min(1,Math.max(0,(window.scrollY-start)/maximum)):1;
   if(root.current){root.current.hidden=maximum<=1;root.current.setAttribute('aria-valuenow',String(Math.round(progress*100)));}
   if(fill.current)fill.current.style.transform='scaleX('+progress+')';
  };
  const measure=()=>{measureFrame=0;const panel=paper?document.querySelector<HTMLElement>('.detail-panel'):null;const header=document.querySelector('header')?.getBoundingClientRect().bottom||0;start=panel?Math.max(0,panel.getBoundingClientRect().top+window.scrollY-header):0;maximum=panel?Math.max(0,panel.getBoundingClientRect().bottom+window.scrollY-window.innerHeight-start):document.documentElement.scrollHeight-window.innerHeight;update();};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const resize=()=>{if(!measureFrame)measureFrame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(resize);observer.observe(document.body);const panel=document.querySelector('.detail-panel');if(panel)observer.observe(panel);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',resize,{passive:true});resize();
  return()=>{cancelAnimationFrame(frame);cancelAnimationFrame(measureFrame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);};
 },[path,paper]);
 return <div ref={root} className="scroll-progress" role="progressbar" aria-label={paper?'Paper reading progress':'Page scroll progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} hidden><span ref={fill}/></div>;
}
