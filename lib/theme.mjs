export const themeConfig={cookie:'kuta-theme',storage:'archive-theme'};
/** Runs synchronously in head, before stylesheet/body paint. No module dependencies. */
function bootstrap(config){
 const root=document.documentElement;
 const valid=value=>value==='dark'||value==='light';
 const stored=()=>{try{return localStorage.getItem(config.storage);}catch{return null;}};
 const cookie=()=>document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(config.cookie+'='))?.slice(config.cookie.length+1);
 const persist=theme=>{try{localStorage.setItem(config.storage,theme);}catch{}document.cookie=config.cookie+'='+theme+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');};
 const sync=()=>document.querySelectorAll('input[data-theme-control]').forEach(input=>{input.checked=root.dataset.theme==='dark';});
 const apply=theme=>{root.classList.add('theme-switching');root.dataset.theme=theme;sync();window.dispatchEvent(new Event('kuta-theme-change'));requestAnimationFrame(()=>requestAnimationFrame(()=>{root.classList.add('theme-ready');root.classList.remove('theme-switching');}));};
 const choose=()=>{const c=cookie(),s=stored();if(valid(c))return c;if(valid(s)){persist(s);return s;}return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';};
 apply(choose());
 new MutationObserver(sync).observe(document,{childList:true,subtree:true});
 window.addEventListener('kuta-set-theme',event=>{if(valid(event.detail)){persist(event.detail);apply(event.detail);}});
 window.addEventListener('pagehide',()=>root.setAttribute('data-restoring',''));
 window.addEventListener('pageshow',event=>{apply(choose());if(event.persisted)location.reload();else root.removeAttribute('data-restoring');});
 window.addEventListener('storage',event=>{if(event.key===config.storage&&valid(event.newValue)){persist(event.newValue);apply(event.newValue);}});
 matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(!valid(cookie())&&!valid(stored()))apply(choose());});
}
export const themeBootstrapScript='('+bootstrap.toString()+')('+JSON.stringify(themeConfig)+');';
/** @param {'light'|'dark'} theme */
export function changeTheme(theme){window.dispatchEvent(new CustomEvent('kuta-set-theme',{detail:theme}));}
