'use client';
import {departmentAccentFor} from '@/lib/departments';
import {normalizeKeywords} from '@/lib/keywords.mjs';
import {programFor} from '@/lib/programs';
import {KeywordChips} from './keyword-chips';
import {uploadPaper} from '@/lib/upload-paper';

import { useCallback,useEffect,useRef,useState,type FormEvent } from 'react';
type Program={id:number;slug:string;name:string;major:string|null};
type Review={q:string;status:string;program:string;page:number};
type Counts={statuses:{all:number;pending:number;verified:number};programs:{slug:string;label:string;count:number}[];total:number;pages:number;page:number};
const readReview=():Review=>{const p=new URLSearchParams(window.location.search);return {q:p.get('q')||'',status:['all','verified'].includes(p.get('status')||'')?p.get('status')!:'pending',program:p.get('program')||'',page:Math.max(1,Number(p.get('page'))||1)};};
type Row={id:number;slug:string;title:string;status:'pending'|'verified'|'demo';year:number;has_file:boolean;authors:string;program_id:string;program:string;keywords:string[]};
type Form={title:string;authors:string;program_id:string;year:string;department:string;category:string;keywords:string;abstract:string;status:'pending'|'verified'|'demo'};
const empty:Form={title:'',authors:'',program_id:'',year:'2026',department:'',category:'Research Paper',keywords:'',abstract:'',status:'pending'};
export function AdminConsole(){
  const fileInput=useRef<HTMLInputElement>(null);
  const [programs,setPrograms]=useState<Program[]>([]),[rows,setRows]=useState<Row[]>([]),[form,setForm]=useState<Form>(empty);
  const [editing,setEditing]=useState<number|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState(''),[file,setFile]=useState<File|null>(null);
  const [review,setReview]=useState<Review>({q:'',status:'pending',program:'',page:1}),[ready,setReady]=useState(false);
  const [counts,setCounts]=useState<Counts|null>(null),[listError,setListError]=useState('');
  const sequence=useRef(0);
  useEffect(()=>{const sync=()=>{setReview(readReview());setReady(true);};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    const seq=++sequence.current;setLoading(true);setListError('');
    const params=new URLSearchParams({status:review.status});
    if(review.q.trim())params.set('q',review.q.trim());if(review.program)params.set('program',review.program);if(review.page>1)params.set('page',String(review.page));
    window.history.replaceState(null,'','/admin?'+params);
    try{
      const [pr,pa]=await Promise.all([fetch('/api/programs',{cache:'no-store',signal}),fetch('/api/admin/records?'+params,{cache:'no-store',signal})]);
      if(!pr.ok||!pa.ok)throw new Error('The dashboard could not load. Try again.');
      const result=await pa.json() as Counts&{papers:Row[]};const catalog=await pr.json() as {programs:Program[]};
      if(seq!==sequence.current||signal?.aborted)return;
      setPrograms(catalog.programs);setRows(result.papers);setCounts(result);
      if(result.page!==review.page){params.set('page',String(result.page));window.history.replaceState(null,'','/admin?'+params);setReview(current=>({...current,page:result.page}));}
    }catch(error){if(!signal?.aborted&&seq===sequence.current)setListError((error as Error).message);}
    finally{if(!signal?.aborted&&seq===sequence.current)setLoading(false);}
  },[review]);
  useEffect(()=>{if(!ready)return;const controller=new AbortController();setLoading(true);const timer=setTimeout(()=>void refresh(controller.signal),300);return()=>{clearTimeout(timer);controller.abort();sequence.current++;};},[refresh,ready]);
  const filter=(part:Partial<Review>)=>setReview(current=>({...current,...part,page:part.page??1}));
  function set<K extends keyof Form>(key:K,value:Form[K]){setForm(f=>({...f,[key]:value}));}
  async function edit(row:Row){
    setBusy(true);setNotice('');
    try{
      const res=await fetch(`/api/papers/${encodeURIComponent(row.slug)}?admin=1`,{cache:'no-store'});
      if(!res.ok)throw new Error('Unable to load this record.');
      const paper=(await res.json()) as {title:string;authors:{given:string;family:string}[];program_id:number;year:number;department:string|null;category:string;keywords:string[];abstract:string|null;status:Form['status']};
      setEditing(row.id);setFile(null);if(fileInput.current)fileInput.current.value='';
      setForm({title:paper.title,authors:paper.authors.map((a:{given:string;family:string})=>`${a.given} | ${a.family}`).join('\n'),program_id:String(paper.program_id),year:String(paper.year),department:paper.department||'',category:paper.category||'Research Paper',keywords:paper.keywords.join(', '),abstract:paper.abstract||'',status:paper.status});
      document.getElementById('record-form')?.scrollIntoView({behavior:'smooth'});
    }catch(e){setNotice((e as Error).message);}finally{setBusy(false);}
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setNotice('');
    const authors=form.authors.split('\n').map(line=>line.split('|').map(x=>x.trim())).filter(parts=>parts.some(Boolean));
    if(!authors.length||authors.some(parts=>parts.length!==2||!parts[0]||!parts[1])){setNotice('Enter each author as Given name | Family name.');return;}
    if(file && (file.type!=='application/pdf'||file.size>10*1024*1024)){setNotice('Choose a PDF of 10 MB or less.');return;}
    setBusy(true);
    try{
      const body={...form,authors:authors.map(([given,family])=>({given,family})),program_id:Number(form.program_id),year:Number(form.year),keywords:normalizeKeywords(form.keywords)};
      const res=await fetch(editing?`/api/papers/${editing}`:'/api/papers',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=(await res.json()) as {id:number;error?:string;details?:{field:string;message:string}[]};if(!res.ok)throw new Error(data.details?.map(x=>`${x.field}: ${x.message}`).join('; ')||data.error||'Unable to save.');
      setEditing(data.id);
      if(file){try{await uploadPaper(data.id,file);}catch(error){throw new Error(`Record saved, but PDF upload failed: ${(error as Error).message}`);}}
      setNotice('Research record saved.');setForm(empty);setEditing(null);setFile(null);if(fileInput.current)fileInput.current.value='';await refresh();
    }catch(e){setNotice((e as Error).message);}finally{setBusy(false);}
  }
  async function remove(row:Row){
    if(!window.confirm(`Delete “${row.title}”? This cannot be undone.`))return;
    setBusy(true);setNotice('');
    try{const res=await fetch(`/api/papers/${row.id}`,{method:'DELETE'});if(!res.ok)throw new Error(((await res.json()) as {error?:string}).error||'Unable to delete.');setNotice('Record deleted.');await refresh();}
    catch(e){setNotice((e as Error).message);}finally{setBusy(false);}
  }
  return <div className="admin-layout">
    <section className="admin-panel" aria-labelledby="admin-list-title"><h2 id="admin-list-title">Records</h2>
      <div className="review-controls"><label htmlFor="review-search">Search records</label><div className="review-search"><input id="review-search" type="search" maxLength={200} value={review.q} onChange={e=>filter({q:e.target.value})} placeholder="Title, author, keyword, program or year"/>{review.q&&<button type="button" aria-label="Clear record search" onClick={()=>filter({q:''})}>×</button>}</div>
      <div className="review-selects"><label>Status<select value={review.status} onChange={e=>filter({status:e.target.value})}>{(['pending','verified','all'] as const).map(status=><option key={status} value={status}>{status[0].toUpperCase()+status.slice(1)}{counts?` (${counts.statuses[status]})`:''}</option>)}</select></label>
      <label>Program<select value={review.program} onChange={e=>filter({program:e.target.value})}><option value="">All programs{counts?` (${counts.programs.reduce((n,p)=>n+p.count,0)})`:''}</option>{counts?.programs.map(p=><option key={p.slug} value={p.slug}>{p.label} ({p.count})</option>)}</select></label></div></div>
      <p role="status" className="review-summary">{loading?'Searching records…':listError?'Records unavailable':`${counts?.total??0} matching records`}</p>
      {listError?<div role="alert"><p>{listError}</p><button type="button" onClick={()=>void refresh()}>Retry records</button></div>:<div aria-busy={loading}>{rows.length?<ul className="admin-records">{rows.map(row=><li key={row.id} className={departmentAccentFor(row.program_id).className}><div><strong>{row.title}</strong><span className="tag">{programFor(row.program_id)?.label||'Uncategorized'}</span><p className="review-authors">{row.authors||'Authors not recorded'}</p><KeywordChips keywords={row.keywords}/><small>{row.year} · {row.status}{row.has_file?' · PDF attached':''}</small></div><div className="admin-record-actions"><button type="button" disabled={busy||loading} onClick={()=>edit(row)}>Edit</button><button type="button" disabled={busy||loading} onClick={()=>remove(row)}>Delete</button></div></li>)}</ul>:!loading&&<p>No records match. Try another search, status, or program.</p>}</div>}
      {counts&&counts.pages>1&&<nav className="pagination" aria-label="Review queue pages"><button disabled={loading||counts.page<=1} type="button" onClick={()=>filter({page:counts.page-1})}>Previous</button><span>Page {counts.page} of {counts.pages}</span><button disabled={loading||counts.page>=counts.pages} type="button" onClick={()=>filter({page:counts.page+1})}>Next</button></nav>}
      <button className="button button-outline" type="button" disabled={loading||busy} onClick={()=>void refresh()}>Refresh records</button></section>
    <section className="admin-panel" id="record-form" aria-labelledby="admin-form-title"><h2 id="admin-form-title">{editing?'Edit research record':'Add research record'}</h2><p>New records begin as pending and are hidden from public search.</p><form onSubmit={save} className="admin-form">
      <label>Title<input required maxLength={300} value={form.title} onChange={e=>set('title',e.target.value)}/></label>
      <label>Authors <small>One per line: Given name | Family name</small><textarea required rows={3} value={form.authors} onChange={e=>set('authors',e.target.value)}/></label>
      <div className="admin-form-row"><label>Program<select className={departmentAccentFor(programs.find(p=>String(p.id)===form.program_id)?.slug||'').className} required value={form.program_id} onChange={e=>set('program_id',e.target.value)}><option value="">Select program</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}{p.major?` — ${p.major}`:''}</option>)}</select></label><label>Year<input type="number" min="2009" max="2026" required value={form.year} onChange={e=>set('year',e.target.value)}/></label></div>
      <div className="admin-form-row"><label>Department<input value={form.department} onChange={e=>set('department',e.target.value)}/></label><label>Category<input required value={form.category} onChange={e=>set('category',e.target.value)}/></label></div>
      <label>Keywords <small>Separate with commas</small><input value={form.keywords} onChange={e=>set('keywords',e.target.value)}/></label><KeywordChips keywords={form.keywords}/>
      <label>Abstract<textarea rows={5} value={form.abstract} onChange={e=>set('abstract',e.target.value)}/></label>
      <label>Status<select value={form.status} onChange={e=>set('status',e.target.value as Form['status'])}><option value="pending">Pending review</option><option value="verified">Verified</option><option value="demo">Demo record. Sample content only.</option></select></label>
      <label>PDF <small>Optional, up to 10 MB; available only to administrators</small><input ref={fileInput} type="file" accept="application/pdf,.pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      <div className="admin-form-actions"><button className="button button-primary" disabled={busy} type="submit">{busy?'Saving…':editing?'Save changes':'Add record'}</button>{editing&&<button className="button button-outline" type="button" onClick={()=>{setEditing(null);setForm(empty);setFile(null);if(fileInput.current)fileInput.current.value='';}}>Cancel edit</button>}</div>
    </form><p role="status" aria-live="polite" className="admin-notice">{notice}</p></section>
  </div>;
}




