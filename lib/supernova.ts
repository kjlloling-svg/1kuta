type Theme = 'light' | 'dark';
let running=false;
const noop=()=>{};
/** A composited bloom keeps the theme swap responsive without a full-screen canvas. */
export function supernova(originX:number,originY:number,_nextTheme:Theme,onSwap:()=>void):()=>void{
 if(running)return noop;
 const media=matchMedia('(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (forced-colors: active)');
 if(media.matches){onSwap();return noop;}
 const tokens=getComputedStyle(document.documentElement);
 // Production CSS may normalize milliseconds to seconds.
 const milliseconds=(name:string)=>{const value=tokens.getPropertyValue(name).trim();return value.endsWith('ms')?parseFloat(value):value.endsWith('s')?parseFloat(value)*1000:NaN;};
 const duration=milliseconds('--motion-slow'),swapAt=milliseconds('--motion-base');
 if(!Number.isFinite(duration)||!Number.isFinite(swapAt)){onSwap();return noop;}
 running=true;
 const bloom=document.createElement('div');bloom.dataset.supernova='';bloom.className='theme-bloom';bloom.setAttribute('aria-hidden','true');
 const diameter=Math.hypot(innerWidth,innerHeight)*2;
 bloom.style.setProperty('--bloom-x',originX+'px');bloom.style.setProperty('--bloom-y',originY+'px');bloom.style.setProperty('--bloom-size',diameter+'px');
 let disposed=false,swapped=false;
 const swap=()=>{if(!swapped){swapped=true;onSwap();}};
 const cleanup=()=>{if(disposed)return;disposed=true;clearTimeout(swapTimer);clearTimeout(endTimer);bloom.remove();running=false;window.removeEventListener('pagehide',cleanup);window.removeEventListener('resize',cleanup);document.removeEventListener('visibilitychange',hide);media.removeEventListener('change',change);};
 const hide=()=>{if(document.hidden)cleanup();};
 const change=()=>{if(media.matches){try{swap();}finally{cleanup();}}};
 const swapTimer=setTimeout(()=>{try{swap();}catch(error){cleanup();throw error;}},swapAt),endTimer=setTimeout(cleanup,duration);
 document.body.appendChild(bloom);
 if('showPopover' in bloom){bloom.setAttribute('popover','manual');try{bloom.showPopover();}catch{/* Fixed positioning remains the fallback. */}}
 window.addEventListener('pagehide',cleanup);window.addEventListener('resize',cleanup);document.addEventListener('visibilitychange',hide);media.addEventListener('change',change);
 return cleanup;
}
