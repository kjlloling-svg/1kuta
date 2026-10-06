'use client';
import {useId,useRef,useState} from 'react';
import {GoogleSignIn} from './google-sign-in';
import {useFavorites,toggleFavorite,retryFavorites} from './favorites-store';
export function FavoriteButton({slug,status='verified'}:{slug:string;status?:string}){
 const saved=useFavorites(),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
 const [open,setOpen]=useState(false),[returnTo,setReturnTo]=useState('/');
 if(status!=='verified'||saved.role==='admin')return null;
 const active=saved.slugs.has(slug),message=saved.errors[slug]||saved.errors.load;
 return <div className="favorite-control"><button ref={trigger} type="button" className="favorite-button" aria-pressed={active} aria-label={active?'Remove from favorites':'Add to favorites'} aria-describedby={message?id+'-error':undefined} disabled={!saved.ready||saved.busy.has(slug)} onClick={()=>{
  if(saved.role==='guest'){setReturnTo(window.location.pathname+window.location.search+window.location.hash);setOpen(true);dialog.current?.showModal();}
  else void toggleFavorite(slug);
 }}><svg aria-hidden="true" width="19" height="22" viewBox="0 0 20 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7"><path d="M4 3h12v18l-6-4-6 4z"/></svg><span>{active?'Saved':'Favorites'}</span></button>
 {message&&<p id={id+'-error'} role="status" className="favorite-error">{message}{saved.errors.load&&<button type="button" onClick={()=>void retryFavorites()}>Retry Favorites</button>}</p>}
 <dialog ref={dialog} className="citation-dialog" aria-labelledby={id} onClose={()=>{setOpen(false);trigger.current?.focus();}} onClick={e=>{if(e.target===dialog.current)dialog.current?.close();}}><div className="dialog-head"><h2 id={id}>Sign in to save favorites</h2><button type="button" className="dialog-close" aria-label="Close sign-in" onClick={()=>dialog.current?.close()}>×</button></div>{open&&<GoogleSignIn returnTo={returnTo}/>}</dialog></div>;
}
