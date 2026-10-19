'use client';
import {useId,useSyncExternalStore} from 'react';
import {changeTheme} from '@/lib/theme.mjs';

const subscribe=(notify:()=>void)=>{window.addEventListener('kuta-theme-change',notify);return()=>window.removeEventListener('kuta-theme-change',notify);};
const snapshot=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
const serverSnapshot=()=>null;

export function ThemeToggle(){
 const mask=useId();
 const theme=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 return <button type="button" role="switch" className="theme-toggle" data-theme-control aria-label="Dark mode" aria-checked={theme==='dark'} title="Dark mode" disabled={theme===null} onClick={()=>changeTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')}>
  <span className="theme-knob" aria-hidden="true">
   <svg className="theme-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs><mask id={mask}><rect width="24" height="24" fill="white"/><circle className="theme-crescent" cx="24" cy="0" r="7" fill="black"/></mask></defs>
    <g className="theme-rays" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></g>
    <circle cx="12" cy="12" r="6" fill="currentColor" mask={`url(#${mask})`}/>
   </svg>
  </span>
 </button>;
}
