'use client';
import {useId,useRef,useState} from 'react';
import {Bookmark,LoaderCircle} from 'lucide-react';
import {GoogleSignIn} from './google-sign-in';
import {useFavorites,toggleFavorite,retryFavorites} from './favorites-store';
export function FavoriteButton({slug,status='verified'}:{slug:string;status?:string}){
 const saved=useFavorites(),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
 const [open,setOpen]=useState(false),[returnTo,setReturnTo]=useState('/'),[announcement,setAnnouncement]=useState(''),[tipHidden,setTipHidden]=useState(false);
 if(status!=='verified'||saved.role==='admin')return null;
 const active=saved.slugs.has(slug),busy=saved.busy.has(slug),message=saved.errors[slug]||saved.errors.load;
 const label=active?'Remove from favorites':'Save to favorites';
 return <div className="favorite-control">
  <button ref={trigger} type="button" className="favorite-button" onFocus={()=>setTipHidden(false)} onMouseEnter={()=>setTipHidden(false)} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setTipHidden(true);}}} aria-pressed={active} aria-label={label} aria-describedby={message?id+'-error':id+'-tip'} aria-busy={busy} disabled={!saved.ready||busy} onClick={async e=>{
   e.stopPropagation();
   if(saved.role==='guest'){setReturnTo(window.location.pathname+window.location.search+window.location.hash);setOpen(true);dialog.current?.showModal();}
   else{setAnnouncement('Updating favorites…');const ok=await toggleFavorite(slug);setAnnouncement(ok?(active?'Removed from favorites.':'Saved to favorites.'):'Favorites update failed. Previous state restored.');}
  }}>{busy?<LoaderCircle className="favorite-loading" aria-hidden="true" size={20}/>:<Bookmark aria-hidden="true" size={20} fill={active?'currentColor':'none'}/>}</button>
  <span id={id+'-tip'} className="favorite-tooltip" role="tooltip" data-dismissed={tipHidden}>{label}</span>
  <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  {message&&<p id={id+'-error'} role="status" className="favorite-error">{message}{saved.errors.load&&<button type="button" onClick={e=>{e.stopPropagation();void retryFavorites();}}>Retry Favorites</button>}</p>}
  <dialog ref={dialog} className="citation-dialog" aria-labelledby={id} onClose={()=>{setOpen(false);trigger.current?.focus();}} onClick={e=>{e.stopPropagation();if(e.target===dialog.current)dialog.current?.close();}}><div className="dialog-head"><h2 id={id}>Sign in to save favorites</h2><button type="button" className="dialog-close" aria-label="Close sign-in" onClick={()=>dialog.current?.close()}>×</button></div>{open&&<GoogleSignIn returnTo={returnTo}/>}</dialog>
 </div>;
}
