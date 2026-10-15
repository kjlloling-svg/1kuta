'use client';
import {useEffect,useRef} from 'react';
import './space-background.css';

/** Place inside a positioned hero; decoration never occupies document flow. */
export function SpaceBackground(){
 const bokeh=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const layer=bokeh.current,host=layer?.parentElement;if(!layer||!host)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,x=0,y=0;
  const reset=()=>{cancelAnimationFrame(frame);frame=0;layer.style.removeProperty('transform');};
  const move=(event:PointerEvent)=>{
   if(motion.matches||event.pointerType!=='mouse')return;
   const bounds=host.getBoundingClientRect();
   if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom){reset();return;}
   x=((event.clientX-bounds.left)/bounds.width-.5)*36;
   y=((event.clientY-bounds.top)/bounds.height-.5)*24;
   // Coalesce pointer events without introducing a continuously running animation loop.
   if(!frame)frame=requestAnimationFrame(()=>{frame=0;layer.style.transform=`translate3d(${x}px,${y}px,0)`;});
  };
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('blur',reset);document.addEventListener('pointerleave',reset);
  document.addEventListener('visibilitychange',reset);window.addEventListener('resize',reset);window.addEventListener('scroll',reset,{passive:true});motion.addEventListener('change',reset);
  return()=>{reset();window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);document.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',reset);window.removeEventListener('resize',reset);window.removeEventListener('scroll',reset);motion.removeEventListener('change',reset);};
 },[]);
 return <div className="space-background" aria-hidden="true"><div className="sb-stars"/><div className="sb-planet"/><div ref={bokeh} className="sb-bokeh"><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/><i className="sb-orb"/></div><div className="sb-sheets"><div className="sb-sheet"/><div className="sb-sheet"/><div className="sb-sheet"/></div></div>;}
