'use client';
import {useEffect,useRef} from 'react';
/** DOM-only updates avoid rendering the entire tree for each scroll event. */
export function ScrollProgress(){
 const root=useRef<HTMLDivElement>(null),fill=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  let frame=0;
  const update=()=>{frame=0;const doc=document.documentElement;const maximum=doc.scrollHeight-doc.clientHeight;const progress=maximum>0?Math.min(1,Math.max(0,doc.scrollTop/maximum)):1;
   if(root.current){root.current.hidden=maximum<=1;root.current.setAttribute('aria-valuenow',String(Math.round(progress*100)));}
   if(fill.current)fill.current.style.transform='scaleX('+progress+')';
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const observer=new ResizeObserver(schedule);observer.observe(document.body);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});schedule();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[]);
 return <div ref={root} className="scroll-progress" role="progressbar" aria-label="Page scroll progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} hidden><span ref={fill}/></div>;
}
