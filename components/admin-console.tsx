'use client';
import {BatchImporter} from './batch-importer';
import {currentResearchYear,researchYears,parseAuthors,paperInput,issueMessage} from '@/lib/record-validation';
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
type Row={id:number;slug:string;title:string;status:string;year:number;has_file:boolean;authors:string;program_id:string;program:string;keywords:string[]};
type Form={title:string;authors:string;program_id:string;year:string;keywords:string;abstract:string;status:'pending'|'verified'};
const empty=():Form=>({title:'',authors:'',program_id:'',year:String(currentResearchYear()),keywords:'',abstract:'',status:'pending'});
export function AdminConsole({initialReview,initialResult,initialPrograms=[]}:{initialReview?:Review;initialResult?:Counts&{papers:Row[]};initialPrograms?:Program[]}={}){
  const fileInput=useRef<HTMLInputElement>(null),saveLock=useRef(false);
  const [batch,setBatch]=useState(false),[importBusy,setImportBusy]=useState(false),[legacyDemo,setLegacyDemo]=useState(false),[success,setSuccess]=useState('');
  useEffect(()=>{if(!success)return;const timer=setTimeout(()=>setSuccess(''),6000);return()=>clearTimeout(timer);},[success]);
  const [programs,setPrograms]=useState<Program[]>(initialPrograms),[rows,setRows]=useState<Row[]>(initialResult?.papers||[]),[form,setForm]=useState<Form>(empty);
  const [editing,setEditing]=useState<number|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(!initialResult),[notice,setNotice]=useState(''),[file,setFile]=useState<File|null>(null);
  const [review,setReview]=useState<Review>(initialReview||{q:'',status:'pending',program:'',page:1}),[ready,setReady]=useState(false);
  const [counts,setCounts]=useState<Counts|null>(initialResult||null),[listError,setListError]=useState('');
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
  useEffect(()=>{if(!ready)return;const controller=new AbortController();const timer=setTimeout(()=>void refresh(controller.signal),300);return()=>{clearTimeout(timer);controller.abort();};},[refresh,ready]);
  const filter=(part:Partial<Review>)=>setReview(current=>({...current,...part,page:part.page??1}));
  function set<K extends keyof Form>(key:K,value:Form[K]){setForm(f=>({...f,[key]:value}));}
  async function edit(row:Row){
    setBusy(true);setNotice('');
    try{
      const res=await fetch(`/api/papers/${encodeURIComponent(row.slug)}?admin=1`,{cache:'no-store'});
      if(!res.ok)throw new Error('Unable to load this record.');
      const paper=(await res.json()) as {title:string;authors:{given:string;family:string}[];program_id:number;year:number;keywords:string[];abstract:string|null;status:Form['status']|'demo'};
      setLegacyDemo(paper.status==='demo');setBatch(false);setEditing(row.id);setFile(null);if(fileInput.current)fileInput.current.value='';
      setForm({title:paper.title,authors:paper.authors.map((a:{given:string;family:string})=>`${a.given} | ${a.family}`).join('\n'),program_id:String(paper.program_id),year:String(paper.year),keywords:paper.keywords.join(', '),abstract:paper.abstract||'',status:paper.status==='demo'?'pending':paper.status});
      document.getElementById('record-form')?.scrollIntoView({behavior:'smooth'});
    }catch(e){setNotice((e as Error).message);}finally{setBusy(false);}
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(saveLock.current||busy||importBusy)return;setNotice('');setSuccess('');
    let body;
    try{body=paperInput.parse({...form,authors:parseAuthors(form.authors),program_id:Number(form.program_id),year:Number(form.year),keywords:normalizeKeywords(form.keywords)});}catch(error){setNotice(issueMessage(error));return;}
    if(file && (file.type!=='application/pdf'||file.size>10*1024*1024)){setNotice('Choose a PDF of 10 MB or less.');return;}
    saveLock.current=true;setBusy(true);
    const updating=editing!==null;
    try{
      const res=await fetch(editing?`/api/papers/${editing}`:'/api/papers',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
      const data=(await res.json()) as {id:number;error?:string;details?:{field:string;message:string}[]};if(!res.ok)throw new Error(data.details?.map(x=>`${x.field}: ${x.message}`).join('; ')||data.error||'Unable to save.');
      setEditing(data.id);
      if(file){try{await uploadPaper(data.id,file);}catch(error){throw new Error(`Record saved, but PDF upload failed: ${(error as Error).message}`);}}
      setSuccess(updating?'Research record updated successfully':'Research record added successfully');setForm(empty());setLegacyDemo(false);setEditing(null);setFile(null);if(fileInput.current)fileInput.current.value='';await refresh();
    }catch(e){setNotice(e instanceof TypeError||e instanceof SyntaxError||e instanceof DOMException?'We could not confirm the save. Check your connection and retry; your entered details are still here.':(e as Error).message);}finally{saveLock.current=false;setBusy(false);}
  }
  async function remove(row:Row){
    if(!window.confirm(`Delete “${row.title}”? This cannot be undone.`))return;
    setBusy(true);setNotice('');
    try{const res=await fetch(`/api/papers/${row.id}`,{method:'DELETE'});if(!res.ok)throw new Error(((await res.json()) as {error?:string}).error||'Unable to delete.');setNotice('Record deleted.');await refresh();}
    catch(e){setNotice((e as Error).message);}finally{setBusy(false);}
  }
  return <div className="admin-layout">
    {success&&<div className="auth-toast" role="status" aria-live="polite"><span>{success}</span><button type="button" className="button button-outline" onClick={()=>setSuccess('')}>Dismiss</button></div>}
    <section className="admin-panel" aria-labelledby="admin-list-title"><h2 id="admin-list-title">Records</h2>
      <div className="review-controls"><label htmlFor="review-search">Search records</label><div className="review-search"><input id="review-search" type="search" maxLength={200} value={review.q} onChange={e=>filter({q:e.target.value})} placeholder="Title, author, keyword, program or year"/>{review.q&&<button type="button" aria-label="Clear record search" onClick={()=>filter({q:''})}>×</button>}</div>
      <div className="review-selects"><label>Status<select value={review.status} onChange={e=>filter({status:e.target.value})}>{(['pending','verified','all'] as const).map(status=><option key={status} value={status}>{status[0].toUpperCase()+status.slice(1)}{counts?` (${counts.statuses[status]})`:''}</option>)}</select></label>
      <label>Program<select value={review.program} onChange={e=>filter({program:e.target.value})}><option value="">All programs{counts?` (${counts.programs.reduce((n,p)=>n+p.count,0)})`:''}</option>{counts?.programs.map(p=><option key={p.slug} value={p.slug}>{p.label} ({p.count})</option>)}</select></label></div></div>
      <p role="status" className="review-summary">{loading?'Searching records…':listError?'Records unavailable':`${counts?.total??0} matching records`}</p>
      {listError?<div role="alert"><p>{listError}</p><button type="button" onClick={()=>void refresh()}>Retry records</button></div>:<div aria-busy={loading}>{rows.length?<ul className="admin-records">{rows.map(row=><li key={row.id} className={departmentAccentFor(row.program_id).className}><div><strong>{row.title}</strong><span className="tag">{programFor(row.program_id)?.label||'Uncategorized'}</span><p className="review-authors">{row.authors||'Authors not recorded'}</p><KeywordChips keywords={row.keywords}/><small>{row.year} · {row.status}{row.has_file?' · PDF attached':''}</small></div><div className="admin-record-actions"><button type="button" disabled={busy||importBusy||loading} onClick={()=>edit(row)}>Edit</button><button type="button" disabled={busy||importBusy||loading} onClick={()=>remove(row)}>Delete</button></div></li>)}</ul>:!loading&&<p>No records match. Try another search, status, or program.</p>}</div>}
      {counts&&counts.pages>1&&<nav className="pagination" aria-label="Review queue pages"><button disabled={loading||counts.page<=1} type="button" onClick={()=>filter({page:counts.page-1})}>Previous</button><span>Page {counts.page} of {counts.pages}</span><button disabled={loading||counts.page>=counts.pages} type="button" onClick={()=>filter({page:counts.page+1})}>Next</button></nav>}
      <button className="button button-outline" type="button" disabled={loading||busy} onClick={()=>void refresh()}>Refresh records</button></section>
    <section className="admin-panel" id="record-form" aria-labelledby="admin-form-title"><h2 id="admin-form-title">{editing?'Edit research record':'Add research record'}</h2><p>Pending records are hidden from public search. Verified records are public.</p><div className="admin-form-actions"><button type="button" className="button button-outline" aria-pressed={!batch} disabled={busy||importBusy} onClick={()=>setBatch(false)}>Add record</button><button type="button" className="button button-outline" aria-pressed={batch} disabled={busy||importBusy} onClick={()=>setBatch(true)}>Upload multiple records</button></div>{batch?<BatchImporter programs={programs} onImported={refresh} onBusy={setImportBusy}/>:<form onSubmit={save} className="admin-form" aria-busy={busy}>
      <label>Title<input required maxLength={300} value={form.title} onChange={e=>set('title',e.target.value)}/></label>
      <label>Authors <small>One per line: Given name | Family name</small><textarea required rows={3} value={form.authors} onChange={e=>set('authors',e.target.value)}/></label>
      <div className="admin-form-row"><label>Program<select className={departmentAccentFor(programs.find(p=>String(p.id)===form.program_id)?.slug||'').className} required value={form.program_id} onChange={e=>set('program_id',e.target.value)}><option value="">Select program</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}{p.major?` — ${p.major}`:''}</option>)}</select></label><label>Year<select required value={form.year} onChange={e=>set('year',e.target.value)}>{researchYears().map(year=><option value={year} key={year}>{year}</option>)}</select></label></div>
      <label>Category<input value="Research Paper" readOnly/></label>
      <label>Keywords <small>Separate with commas</small><input value={form.keywords} onChange={e=>set('keywords',e.target.value)}/></label><KeywordChips keywords={form.keywords}/>
      <label>Abstract<textarea rows={5} value={form.abstract} onChange={e=>set('abstract',e.target.value)}/></label>
      {legacyDemo?<p role="note">Legacy Demo record — its status will be preserved.</p>:<label>Status<select value={form.status} onChange={e=>set('status',e.target.value as Form['status'])}><option value="pending">Pending review</option><option value="verified">Verified</option></select></label>}
      <label>PDF <small>Optional, up to 10 MB; available only to administrators</small><input ref={fileInput} type="file" accept="application/pdf,.pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      <div className="admin-form-actions"><button className="button button-primary" disabled={busy||importBusy} type="submit">{busy?'Saving…':editing?'Save changes':'Add record'}</button>{editing&&<button className="button button-outline" type="button" disabled={busy} onClick={()=>{setEditing(null);setForm(empty());setLegacyDemo(false);setFile(null);if(fileInput.current)fileInput.current.value='';}}>Cancel edit</button>}</div>
    </form>}<p role="alert" className="admin-notice">{notice}</p></section>
  </div>;
}




