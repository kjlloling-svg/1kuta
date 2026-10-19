'use client';
import {useEffect,useRef,useSyncExternalStore,type CSSProperties} from 'react';
import {usePathname} from 'next/navigation';
import {departmentAccents} from '@/lib/departments';
import './space-background.css';

const pointerQuery='(hover: hover) and (pointer: fine) and (min-width:640px) and (prefers-reduced-motion: no-preference) and (prefers-reduced-transparency: no-preference) and (forced-colors: none)';
const subscribe=(notify:()=>void)=>{const media=matchMedia(pointerQuery);media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const snapshot=()=>matchMedia(pointerQuery).matches;
const serverSnapshot=()=>false;

/** One shared decoration layer; pointer updates never trigger React renders. */
export function SpaceBackground(){
 const path=usePathname(),variant=path==='/'?'full':'accent';
 const background=useRef<HTMLDivElement>(null),cursor=useRef<HTMLDivElement>(null),sentinel=useRef<HTMLSpanElement>(null);
 const enabled=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 useEffect(()=>{
  const root=document.documentElement,marker=sentinel.current;if(!marker||!('IntersectionObserver' in window))return;
  root.dataset.scrolled=String(window.scrollY>24);
  const observer=new IntersectionObserver(([entry])=>{root.dataset.scrolled=String(!entry.isIntersecting);});observer.observe(marker);
  return()=>{observer.disconnect();delete root.dataset.scrolled;};
 },[]);
 useEffect(()=>{
  const slug=new URLSearchParams(window.location.search).get('program')||path.split('/').at(-1)||'';
  const token=Object.hasOwn(departmentAccents,slug)?departmentAccents[slug as keyof typeof departmentAccents].accentToken:'--green';
  for(const layer of [background.current,cursor.current])layer?.style.setProperty('--effect-accent',`var(${token})`);
 },[path,enabled]);
 useEffect(()=>{
  const light=cursor.current,layer=background.current;if(!enabled||!light||!layer)return;
  const range=Number(getComputedStyle(document.documentElement).getPropertyValue(variant==='full'?'--motion-parallax-full':'--motion-parallax-accent'));
  let frame=0,x=0,y=0;
  const reset=()=>{cancelAnimationFrame(frame);frame=0;light.style.opacity='0';layer.style.removeProperty('transform');};
  const move=(event:PointerEvent)=>{
   if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
   x=event.clientX;y=event.clientY;
   if(!frame)frame=requestAnimationFrame(()=>{
    frame=0;light.style.transform=`translate3d(${x}px,${y}px,0)`;light.style.opacity='1';
    layer.style.transform=`translate3d(${(x/window.innerWidth-.5)*range}px,${(y/window.innerHeight-.5)*range}px,0)`;
   });
  };
  window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',reset);
  window.addEventListener('resize',reset,{passive:true});document.addEventListener('pointerleave',reset);document.addEventListener('visibilitychange',reset);
  return()=>{reset();window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);window.removeEventListener('resize',reset);document.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',reset);};
 },[enabled,variant]);
 const style={'--effect-accent':'var(--green)'} as CSSProperties;
 return <><span ref={sentinel} className="header-sentinel" aria-hidden="true"/><div ref={background} className="space-background" data-variant={variant} style={style} aria-hidden="true"/>{enabled&&<div ref={cursor} className="cursor-light" data-variant={variant} style={style} aria-hidden="true"/>}</>;
}
