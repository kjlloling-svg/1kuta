'use client';
import {useId,useRef,useState} from 'react';
import {LockKeyhole} from 'lucide-react';
import {GoogleSignIn} from './google-sign-in';
export function LockedResearch({slug,compact=false}:{slug:string;compact?:boolean}){
 const id=useId(),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[returnTo,setReturnTo]=useState('/research-papers/'+encodeURIComponent(slug));
 return <section className={compact?"locked-research locked-research-compact":"locked-research"} aria-label="Abstract and citation require login">{!compact&&<div className="locked-placeholder" aria-hidden="true">A summary of the study and its research context.<br/>The abstract becomes available after signing in.</div>}<p><LockKeyhole aria-hidden="true" size={16}/> Sign in with Google to view the full abstract and citations</p><button ref={trigger} className={compact?"paper-sign-in":"button button-primary"} type="button" onClick={()=>{setReturnTo(window.location.pathname+window.location.search+window.location.hash);setOpen(true);dialog.current?.showModal();}}>Sign in</button><dialog ref={dialog} className="citation-dialog" aria-labelledby={id} onClose={()=>{setOpen(false);trigger.current?.focus();}} onClick={event=>{if(event.target===dialog.current)dialog.current?.close();}}><div className="dialog-head"><h2 id={id}>Sign in with Google</h2><button type="button" className="dialog-close" aria-label="Close sign-in" onClick={()=>dialog.current?.close()}>×</button></div>{open&&<GoogleSignIn returnTo={returnTo}/>}</dialog></section>;
}
