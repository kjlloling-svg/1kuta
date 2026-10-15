'use client';
import {useEffect,useRef,useSyncExternalStore} from 'react';
import {usePathname} from 'next/navigation';
import {changeTheme} from '@/lib/theme.mjs';
import {supernova} from '@/lib/supernova';

const subscribe=(notify:()=>void)=>{window.addEventListener('kuta-theme-change',notify);return()=>window.removeEventListener('kuta-theme-change',notify);};
const snapshot=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
const serverSnapshot=()=>null;

export function ThemeToggle(){
 const button=useRef<HTMLButtonElement>(null),cancel=useRef<(()=>void)|null>(null);
 const pathname=usePathname();
 const theme=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 useEffect(()=>()=>{cancel.current?.();cancel.current=null;},[pathname]);
 return <button ref={button} type="button" className="theme-toggle" data-theme-control aria-label="Toggle dark mode" aria-pressed={theme==='dark'} title="Toggle dark mode" disabled={theme===null} onClick={()=>{
  const bounds=button.current!.getBoundingClientRect();
  const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
  // Keep the original cleanup handle when a rapid second click is ignored.
  if(document.querySelector('[data-supernova]'))return;
  cancel.current=supernova(bounds.left+bounds.width/2,bounds.top+bounds.height/2,next,()=>changeTheme(next));
 }}><span className="theme-knob" aria-hidden="true"><span className="theme-icon-light">☀</span><span className="theme-icon-dark">☾</span></span></button>;
}
