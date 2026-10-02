'use client';
import {departmentAccentFor} from '@/lib/departments';

import { useCallback,useEffect,useRef,useState,type FormEvent } from 'react';
import {canonicalProgram} from '@/lib/programs';
import { InteractivePaperCard,type PublicPaper } from './interactive-paper-card';
type Program={id:number;slug:string;name:string;major:string|null};
type Filter={q:string;author:string;program:string;year:string;keyword:string;sort:string;page:number};
const readUrl=():Filter=>{const s=new URLSearchParams(window.location.search);return {q:s.get('q')||'',author:s.get('author')||'',program:canonicalProgram(s.get('program')||''),year:s.get('year')||'',keyword:s.get('keyword')||'',sort:s.get('sort')||'newest',page:Number(s.get('page'))||1};};
export function ArchiveExplorer({admin=false,authenticated=false}:{admin?:boolean;authenticated?:boolean}){
  const [filter,setFilter]=useState<Filter>({q:'',author:'',program:'',year:'',keyword:'',sort:'newest',page:1});
  const [programs,setPrograms]=useState<Program[]>([]),[keywords,setKeywords]=useState<string[]>([]);
  const [papers,setPapers]=useState<PublicPaper[]>([]),[total,setTotal]=useState<number|null>(null),[pages,setPages]=useState(0);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0),[notice,setNotice]=useState(''),[filterError,setFilterError]=useState(false),[filterRetry,setFilterRetry]=useState(0);
  const loaded=useRef(false),request=useRef(0),focusKeyword=useRef('');
  useEffect(()=>{const back=()=>setFilter(readUrl());const frame=requestAnimationFrame(()=>{loaded.current=true;back();});window.addEventListener('popstate',back);return()=>{cancelAnimationFrame(frame);window.removeEventListener('popstate',back);};},[]);
  useEffect(()=>{const controller=new AbortController();Promise.all([fetch('/api/programs',{signal:controller.signal}),fetch('/api/keywords',{signal:controller.signal})]).then(async([a,b])=>{if(!a.ok||!b.ok)throw new Error('Filters unavailable');setPrograms(((await a.json()) as {programs:Program[]}).programs);setKeywords(((await b.json()) as {keywords:string[]}).keywords);setFilterError(false);}).catch(()=>{if(!controller.signal.aborted)setFilterError(true);});return()=>controller.abort();},[filterRetry]);
  const update=useCallback((part:Partial<Filter>)=>setFilter(current=>({...current,...part,page:part.page??1})),[]);
  useEffect(()=>{
    if(!loaded.current)return;
    const controller=new AbortController(),seq=++request.current;
    setLoading(true);setError('');
    const timer=setTimeout(async()=>{
      const params=new URLSearchParams();
      for(const key of ['q','author','program','year','keyword','sort'] as const)if(filter[key] && !(key==='sort'&&filter[key]==='newest'))params.set(key,filter[key]);
      if(filter.page>1)params.set('page',String(filter.page));
      window.history.replaceState(null,'',`${window.location.pathname}${params.size?`?${params}`:''}`);
      try{
        const response=await fetch(`/api/papers?${params}`,{signal:controller.signal,cache:'no-store'});
        if(!response.ok)throw new Error('Research papers could not be loaded.');
        const result=(await response.json()) as {papers:PublicPaper[];total:number;pages:number};
        if(seq===request.current){setPapers(result.papers);setTotal(result.total);setPages(result.pages);setLoading(false);}
      }catch(e){if(!controller.signal.aborted&&seq===request.current){setError((e as Error).message);setLoading(false);}}
    },filter.q||filter.author?300:0);
    return()=>{clearTimeout(timer);controller.abort();};
  },[filter,retry]);
  function submit(e:FormEvent){e.preventDefault();setNotice('Searching the archive.');setRetry(v=>v+1);}
  function clear(){setNotice('Search and filters cleared.');setFilter({q:'',author:'',program:'',year:'',keyword:'',sort:'newest',page:1});}
  useEffect(()=>{if(!focusKeyword.current)return;const match=[...document.querySelectorAll<HTMLButtonElement>('.keyword-filter .keyword-chip')].find(b=>b.textContent===focusKeyword.current);match?.focus();focusKeyword.current='';},[filter.keyword]);
  return <div className="archive-layout">
    <aside className={`filters ${departmentAccentFor(filter.program).className}`}><form onSubmit={submit} role="search"><div className="filter-head"><h2>Refine results</h2><button type="button" onClick={clear}>Clear filters</button></div><label htmlFor="q">Search the archive</label><input id="q" type="search" value={filter.q} onChange={e=>update({q:e.target.value})} placeholder="Title, author, or keyword"/><label htmlFor="author">Author</label><input id="author" value={filter.author} onChange={e=>update({author:e.target.value})} placeholder="Researcher name"/><label htmlFor="program">Academic program</label><select id="program" value={filter.program} onChange={e=>update({program:e.target.value})}><option value="">All programs</option>{programs.map(p=><option value={p.slug} key={p.slug}>{p.name}{p.major?` — ${p.major}`:''}</option>)}</select><label htmlFor="year">Research year</label><select id="year" value={filter.year} onChange={e=>update({year:e.target.value})}><option value="">All years</option>{Array.from({length:18},(_,i)=>2026-i).map(y=><option value={y} key={y}>{y}</option>)}</select><label htmlFor="sort">Sort by</label><select id="sort" value={filter.sort} onChange={e=>update({sort:e.target.value})}><option value="newest">Newest year first</option><option value="oldest">Oldest year first</option><option value="recent">Recently added</option></select><button className="button button-primary filter-submit" type="submit">Search archive</button></form></aside>
    <div className="results"><p className="card-toast" role="status" aria-live="polite">{notice}</p>{filterError&&<div className="state-card" role="alert"><p>Program and keyword filters could not be loaded.</p><button type="button" onClick={()=>setFilterRetry(v=>v+1)}>Retry filters</button></div>}<div className="results-bar"><div><span className="results-count" role="status" aria-live="polite">{loading?'Searching…':error?'Results unavailable':`${total??0} ${total===1?'result':'results'}`}</span><span className="results-context">Verified records and clearly labeled demos</span></div></div>{filter.year&&<div className="active-year-filter"><button type="button" className="keyword-chip" aria-label={`Remove year filter: ${filter.year}`} onClick={()=>{setNotice(`Year filter removed: ${filter.year}.`);update({year:''});}}>Year: {filter.year} <span aria-hidden="true">×</span></button></div>}<div className="keyword-filter" aria-label="Filter by keyword"><span>Keywords</span>{keywords.map(k=><button type="button" className={`keyword-chip ${departmentAccentFor(filter.program).className}`} aria-pressed={filter.keyword===k} key={k} onClick={()=>{setNotice(filter.keyword===k?`Keyword filter removed: ${k}.`:`Filtered by ${k}.`);update({keyword:filter.keyword===k?'':k});}}>{k}</button>)}{filter.keyword&&<button className="keyword-chip" type="button" onClick={()=>{setNotice('Keyword filter cleared.');update({keyword:''});}}>Clear keyword</button>}</div>
    {loading?<div className="results-grid" aria-label="Loading research papers">{[1,2,3,4].map(i=><div className="paper-skeleton" key={i} aria-hidden="true"/>)}</div>:error?<div className="state-card" role="alert"><h2>Couldn’t load research papers</h2><p>{error}</p><button className="button button-outline" onClick={()=>setRetry(v=>v+1)}>Try again</button></div>:papers.length?<><div className="results-grid">{papers.map(p=><InteractivePaperCard key={p.id} paper={p} admin={admin} authenticated={authenticated} onKeyword={keyword=>{focusKeyword.current=keyword;update({keyword});}}/>)}</div><nav className="pagination" aria-label="Research results pages">{filter.page>1&&<button type="button" onClick={()=>update({page:filter.page-1})}>Previous</button>}<span>Page {filter.page} of {pages}</span>{filter.page<pages&&<button type="button" onClick={()=>update({page:filter.page+1})}>Next</button>}</nav></>:<div className="state-card"><h2>{total===0 && !filter.q&&!filter.author&&!filter.program&&!filter.year&&!filter.keyword?'The archive is ready for verified records':filter.year&&!filter.q&&!filter.author&&!filter.program&&!filter.keyword?`No papers archived for ${filter.year} yet`:'No papers match these filters'}</h2><p>Try another title, author, keyword, year, or program.</p><button className="button button-outline" onClick={clear}>Clear search and filters</button></div>}
    </div>
  </div>;
}





