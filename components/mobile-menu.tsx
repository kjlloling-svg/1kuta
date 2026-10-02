'use client';
import {useCallback,useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
/** Disclosure panel: the server supplies links/account slots, never database rows. */
export function MobileMenu({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false),id=useId(),root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),path=usePathname();
 const close=useCallback((restore=true)=>{setOpen(false);if(restore)button.current?.focus();},[]);
 useEffect(()=>{
  if(!open)return;
  const frame=requestAnimationFrame(()=>panel.current?.querySelector<HTMLElement>('a,button')?.focus());
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))close();};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close();}};
  const resize=()=>{if(window.innerWidth>=1280){close(false);document.querySelector<HTMLAnchorElement>('.brand')?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('resize',resize);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('resize',resize);};
 },[open,close]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>close(false));return()=>cancelAnimationFrame(frame);},[path,close]);
 return <div ref={root} className="mobile-navigation"><button ref={button} className="menu-trigger" type="button" aria-expanded={open} aria-controls={id} onClick={()=>open?close():setOpen(true)}>Menu <span aria-hidden="true">{open?'−':'+'}</span></button><div ref={panel} id={id} className="mobile-panel" hidden={!open} onClick={event=>{if((event.target as Element).closest('a[href]'))close();}}><div className="wrap mobile-panel-inner">{children}</div></div></div>;
}
