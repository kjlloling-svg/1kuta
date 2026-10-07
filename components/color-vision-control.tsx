'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {changeColorVision} from '@/lib/color-vision.mjs';
const choices=[['default','Default (normal vision)'],['red-green','Red-green color deficiency'],['blue-yellow','Blue-yellow color deficiency']] as const;
type Mode=typeof choices[number][0];
export function ColorVisionControl(){
 const id=useId(),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),items=useRef<(HTMLButtonElement|null)[]>([]);
 const [open,setOpen]=useState(false),[mode,setMode]=useState<Mode>('default'),[ready,setReady]=useState(false);
 useEffect(()=>{const sync=()=>{const value=document.documentElement.dataset.cvd;setMode(choices.some(([key])=>key===value)?value as Mode:'default');};sync();setReady(true);window.addEventListener('kuta-cvd-change',sync);return()=>window.removeEventListener('kuta-cvd-change',sync);},[]);
 useEffect(()=>{
  if(!open)return;
  const frame=requestAnimationFrame(()=>items.current[choices.findIndex(([key])=>key===document.documentElement.dataset.cvd)]?.focus());
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  document.addEventListener('pointerdown',outside);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('pointerdown',outside);};
 },[open]);
 const close=()=>{setOpen(false);trigger.current?.focus();};
 return <div ref={root} className="color-vision-control" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}} onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();}}}>
  <button ref={trigger} id={id+'-trigger'} type="button" className="color-vision-trigger" aria-label="Color vision options" title="Color vision options" aria-haspopup="menu" aria-expanded={open} aria-controls={id} disabled={!ready} onClick={()=>setOpen(!open)} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true);}}}>
   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
  </button>
  <div className="color-vision-popover" hidden={!open}>
   <div role="menu" id={id} aria-labelledby={id+'-trigger'} aria-describedby={id+'-note'}>
    {choices.map(([value,label],index)=><button key={value} ref={element=>{items.current[index]=element;}} type="button" role="menuitemradio" aria-checked={mode===value} tabIndex={mode===value?0:-1} onClick={()=>changeColorVision(value)} onKeyDown={event=>{const offset=event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0;if(offset||event.key==='Home'||event.key==='End'){event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?choices.length-1:(index+offset+choices.length)%choices.length;items.current[target]?.focus();}}}>
     <span className="color-vision-check" aria-hidden="true">{mode===value?'✓':'○'}</span><span>{label}</span>
    </button>)}
   </div>
   <p id={id+'-note'}>Adjusts site colors for color vision differences.</p>
  </div>
 </div>;
}
