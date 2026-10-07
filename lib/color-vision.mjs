export const colorVisionStorage='kuta-color-vision';
/** Independent presentation preference; never changes the light/dark cookie or storage. */
function bootstrap(key){
 const root=document.documentElement;
 const valid=value=>['default','red-green','blue-yellow'].includes(value);
 const read=()=>{try{const value=localStorage.getItem(key);return valid(value)?value:'default';}catch{return 'default';}};
 const apply=value=>{root.dataset.cvd=valid(value)?value:'default';window.dispatchEvent(new Event('kuta-cvd-change'));};
 root.classList.add('cvd-initializing');apply(read());
 requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('cvd-initializing')));
 window.addEventListener('kuta-set-cvd',event=>{if(!valid(event.detail))return;try{localStorage.setItem(key,event.detail);}catch{}apply(event.detail);});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null)apply(read());});
}
export const colorVisionBootstrapScript='('+bootstrap.toString()+')('+JSON.stringify(colorVisionStorage)+');';
/** @param {'default'|'red-green'|'blue-yellow'} value */
export function changeColorVision(value){window.dispatchEvent(new CustomEvent('kuta-set-cvd',{detail:value}));}
