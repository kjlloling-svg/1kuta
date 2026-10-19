export const themeConfig={cookie:'kuta-theme',storage:'archive-theme'};
/** Blocking head script: one attribute controls all themes, before the first paint. */
function bootstrap(config){
 const root=document.documentElement,media=matchMedia('(prefers-color-scheme: dark)');
 const valid=value=>value==='dark'||value==='light';
 const stored=()=>{try{return localStorage.getItem(config.storage);}catch{return null;}};
 const choose=()=>{const value=stored();return valid(value)?value:media.matches?'dark':'light';};
 const sync=()=>document.querySelectorAll('button[data-theme-control]:not([disabled])').forEach(button=>button.setAttribute('aria-checked',String(root.dataset.theme==='dark')));
 const apply=theme=>{if(root.dataset.theme!==theme)root.dataset.theme=theme;sync();window.dispatchEvent(new Event('kuta-theme-change'));};
 const persist=theme=>{try{localStorage.setItem(config.storage,theme);}catch{/* Private browsing may disable storage. */}};
 apply(choose());
 requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('theme-ready')));
 window.addEventListener('kuta-set-theme',event=>{if(valid(event.detail)){persist(event.detail);apply(event.detail);}});
 window.addEventListener('pageshow',()=>apply(choose()));
 window.addEventListener('storage',event=>{if(event.key===config.storage||event.key===null)apply(choose());});
 media.addEventListener('change',()=>{if(!valid(stored()))apply(choose());});
}
export const themeBootstrapScript='('+bootstrap.toString()+')('+JSON.stringify(themeConfig)+');';
/** @param {'light'|'dark'} theme */
export function changeTheme(theme){window.dispatchEvent(new CustomEvent('kuta-set-theme',{detail:theme}));}
