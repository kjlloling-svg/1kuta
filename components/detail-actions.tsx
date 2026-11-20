'use client';
import {useRef,useState} from 'react';
import {MoreHorizontal,FileText,Download} from 'lucide-react';
export function DetailActions({slug,title,hasFile,compact=false}:{id:number;slug:string;title:string;hasFile:boolean;compact?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),menu=useRef<HTMLDetailsElement>(null),trigger=useRef<HTMLElement>(null),openButton=useRef<HTMLButtonElement>(null);
 const [text,setText]=useState<string|null>(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[isOpen,setIsOpen]=useState(false);
 async function open(){
  setBusy(true);setNotice('');
  try{
   const response=await fetch(`/api/papers/${encodeURIComponent(slug)}/sections`,{cache:'no-store'});
   if (response.status===403||response.status===401) throw new Error('Sign in as an administrator to view the full paper.');
   if (!response.ok) throw new Error('The full paper could not load. Try again.');
   setText(((await response.json()) as {full_text:string|null}).full_text);
   if(menu.current)menu.current.open=false;
   dialog.current?.showModal();
   setIsOpen(true);
  }catch(error){setNotice((error as Error).message);}finally{setBusy(false);}
 }
 const actions=<><button ref={openButton} type="button" disabled={busy} aria-busy={busy} onClick={()=>void open()}><FileText aria-hidden="true" size={18}/>{busy?'Loading…':'View full paper'}</button>{hasFile&&<a className="button button-outline" href={`/api/papers/${encodeURIComponent(slug)}/download`}><Download aria-hidden="true" size={18}/>Download</a>}</>;
 return <section className={compact?'detail-actions detail-actions-compact':'detail-actions'}>
  {compact?<details ref={menu} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.open=false;}} onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;trigger.current?.focus();}}}><summary ref={trigger} className="paper-action paper-action-icon" aria-label="Administrator actions" title="Administrator actions"><MoreHorizontal aria-hidden="true" size={18}/></summary><div className="paper-overflow-actions">{actions}<p role="status">{notice}</p></div></details>:<><h2>Administrator access</h2><div className="card-actions">{actions}</div><p className="card-toast" role="status">{notice}</p></>}
  <dialog ref={dialog} className="archive-modal" aria-label={`Full paper: ${title}`} onClose={()=>{setIsOpen(false);(compact?trigger.current:openButton.current)?.focus();}} onClick={e=>{if(e.target===dialog.current)dialog.current?.close();}}><div className="modal-heading"><h2>{title}</h2><button type="button" aria-label="Close full paper" onClick={()=>dialog.current?.close()}>×</button></div>{text?<section className="paper-section"><h3>Introduction</h3><p>{text}</p></section>:<p>{hasFile?'Use the attached PDF to view the complete paper.':'The full text isn’t available for this record.'}</p>}{hasFile&&isOpen&&<iframe className="admin-pdf-viewer" title={`Full paper PDF: ${title}`} src={`/api/papers/${encodeURIComponent(slug)}/download?inline=1`}/>}{hasFile&&<a className="button button-primary" href={`/api/papers/${encodeURIComponent(slug)}/download`}>Download full paper PDF</a>}</dialog>
 </section>;
}
