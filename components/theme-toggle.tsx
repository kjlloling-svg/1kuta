'use client';
import {useEffect,useRef} from 'react';
import {changeTheme} from '@/lib/theme.mjs';
/** Native checkbox exposes the actual pre-paint state without hydration text changes. */
export function ThemeToggle({initialTheme='light'}:{initialTheme?:'light'|'dark'}){
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const sync=()=>{if(input.current)input.current.checked=document.documentElement.dataset.theme==='dark';};sync();window.addEventListener('kuta-theme-change',sync);return()=>window.removeEventListener('kuta-theme-change',sync);},[]);
 return <label className="theme-toggle" title="Switch light and dark mode"><input ref={input} className="sr-only" type="checkbox" data-theme-control aria-label="Dark mode" defaultChecked={initialTheme==='dark'} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.click();}}} onChange={e=>changeTheme(e.target.checked?'dark':'light')}/><span className="theme-knob" aria-hidden="true"><span className="theme-icon-light" aria-hidden="true">☀</span><span className="theme-icon-dark" aria-hidden="true">☾</span></span></label>;
}
