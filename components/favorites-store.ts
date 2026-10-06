'use client';
import {useEffect,useSyncExternalStore} from 'react';
type State={role:'loading'|'guest'|'public'|'admin';slugs:ReadonlySet<string>;busy:ReadonlySet<string>;errors:Record<string,string>;ready:boolean};
const initial:State={role:'loading',slugs:new Set(),busy:new Set(),errors:{},ready:false};
let state=initial,inflight:Promise<void>|null=null,started=false;
const listeners=new Set<()=>void>();
const emit=(next:State)=>{state=next;listeners.forEach(fn=>fn());};
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
async function load(){
 if(inflight)return inflight;
 inflight=(async()=>{
  try{
   const auth=await fetch('/api/auth/me',{cache:'no-store'});
   if(auth.status===401){emit({...initial,role:'guest',ready:true});return;}
   if(!auth.ok)throw new Error('Favorites could not load. Please retry.');
   const data=await auth.json() as {role:string};
   if(data.role==='admin'){emit({...initial,role:'admin',ready:true});return;}
   const response=await fetch('/api/bookmarks',{cache:'no-store'});
   if(!response.ok)throw new Error('Favorites could not load. Please retry.');
   const result=await response.json() as {bookmarks:string[]};
   emit({...state,role:'public',slugs:new Set(result.bookmarks),ready:true,errors:{}});
  }catch(error){emit({...state,errors:{...state.errors,load:(error as Error).message},ready:false});}
  finally{inflight=null;}
 })();return inflight;
}
export function useFavorites(){
 const snapshot=useSyncExternalStore(subscribe,()=>state,()=>initial);
 useEffect(()=>{
  if(!started){started=true;void load();}
  const sync=(event:StorageEvent)=>{if(event.key==='kuta-favorites-update'&&!state.busy.size)void load();};
  const focus=()=>{if(!state.busy.size)void load();};
  window.addEventListener('storage',sync);window.addEventListener('focus',focus);
  return()=>{window.removeEventListener('storage',sync);window.removeEventListener('focus',focus);};
 },[]);
 return snapshot;
}
export const retryFavorites=load;
export async function toggleFavorite(slug:string){
 if(state.role!=='public'||!state.ready||state.busy.has(slug))return;
 const was=state.slugs.has(slug),slugs=new Set(state.slugs),busy=new Set(state.busy);
 if(was)slugs.delete(slug);else slugs.add(slug);busy.add(slug);
 emit({...state,slugs,busy,errors:{...state.errors,[slug]:''}});
 try{
  const response=await fetch('/api/bookmarks',{method:was?'DELETE':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paper_id:slug})});
  if(!response.ok){const data=await response.json() as {error?:string};throw new Error(data.error||'Unable to update Favorites. Please try again.');}
  try{localStorage.setItem('kuta-favorites-update',String(Date.now()));}catch{/* Storage can be disabled. */}
  window.dispatchEvent(new Event('favorites-changed'));
 }catch(error){
  const restored=new Set(state.slugs);if(was)restored.add(slug);else restored.delete(slug);
  emit({...state,slugs:restored,errors:{...state.errors,[slug]:(error as Error).message}});
 }finally{const remaining=new Set(state.busy);remaining.delete(slug);emit({...state,busy:remaining});}
}

