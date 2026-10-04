'use client';
import {useId,useRef,useState} from 'react';
import {GoogleSignIn} from './google-sign-in';
export function LockedResearch({slug}:{slug:string}){
 const id=useId(),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[returnTo,setReturnTo]=useState('/research-papers/'+encodeURIComponent(slug));
 return <section className="locked-research" aria-label="Abstract and citation require login"><div className="locked-placeholder" aria-hidden="true">A summary of the study and its research context.<br/>The abstract becomes available after signing in.</div><p><span aria-hidden="true">🔒 </span>Sign in with Google to view the full abstract and citations</p><button ref={trigger} className="button button-primary" type="button" onClick={()=>{setReturnTo(window.location.pathname+window.location.search+window.location.hash);setOpen(true);dialog.current?.showModal();}}>Sign in</button><dialog ref={dialog} className="citation-dialog" aria-labelledby={id} onClose={()=>{setOpen(false);trigger.current?.focus();}} onClick={event=>{if(event.target===dialog.current)dialog.current?.close();}}><div className="dialog-head"><h2 id={id}>Sign in with Google</h2><button type="button" className="dialog-close" aria-label="Close sign-in" onClick={()=>dialog.current?.close()}>×</button></div>{open&&<GoogleSignIn returnTo={returnTo}/>}</dialog></section>;
}
