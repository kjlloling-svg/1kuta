'use client';
import {useEffect,useRef,useSyncExternalStore,type CSSProperties} from 'react';
import {usePathname} from 'next/navigation';
import {departmentAccents} from '@/lib/departments';
import './space-background.css';

const pointerQuery='(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const subscribe=(notify:()=>void)=>{const media=matchMedia(pointerQuery);media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const snapshot=()=>matchMedia(pointerQuery).matches;
const serverSnapshot=()=>false;

/** One shared decoration layer; pointer updates never trigger React renders. */
export function SpaceBackground(){
 const path=usePathname(),variant=path==='/'?'full':'accent';
 const background=useRef<HTMLDivElement>(null),cursor=useRef<HTMLDivElement>(null);
 const enabled=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 useEffect(()=>{
  const root=document.documentElement;let frame=0,scrolled=false;
  const update=()=>{frame=0;const next=window.scrollY>24?true:window.scrollY<=8?false:scrolled;if(next!==scrolled||!root.hasAttribute('data-scrolled')){scrolled=next;root.dataset.scrolled=String(next);}};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  window.addEventListener('scroll',scroll,{passive:true});update();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);delete root.dataset.scrolled;};
 },[]);
 useEffect(()=>{
  const slug=new URLSearchParams(window.location.search).get('program')||path.split('/').at(-1)||'';
  const token=Object.hasOwn(departmentAccents,slug)?departmentAccents[slug as keyof typeof departmentAccents].accentToken:'--green';
  for(const layer of [background.current,cursor.current])layer?.style.setProperty('--effect-accent',`var(${token})`);
 },[path,enabled]);
 useEffect(()=>{
  const light=cursor.current,layer=background.current;if(!enabled||!light||!layer)return;
  let frame=0,x=0,y=0;
  const reset=()=>{cancelAnimationFrame(frame);frame=0;light.style.opacity='0';layer.style.removeProperty('transform');};
  const move=(event:PointerEvent)=>{
   if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
   x=event.clientX;y=event.clientY;
   if(!frame)frame=requestAnimationFrame(()=>{
    frame=0;light.style.transform=`translate3d(${x}px,${y}px,0)`;light.style.opacity='1';
    const range=variant==='full'?18:5;
    layer.style.transform=`translate3d(${(x/window.innerWidth-.5)*range}px,${(y/window.innerHeight-.5)*range}px,0)`;
   });
  };
  window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',reset);
  window.addEventListener('resize',reset,{passive:true});document.addEventListener('pointerleave',reset);document.addEventListener('visibilitychange',reset);
  return()=>{reset();window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);window.removeEventListener('resize',reset);document.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',reset);};
 },[enabled,variant]);
 const style={'--effect-accent':'var(--green)'} as CSSProperties;
 return <><div ref={background} className="space-background" data-variant={variant} style={style} aria-hidden="true"/>{enabled&&<div ref={cursor} className="cursor-light" data-variant={variant} style={style} aria-hidden="true"/>}</>;
}
