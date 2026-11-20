'use client';

import {ArrowLeft,Clock,Search,X} from 'lucide-react';
import {usePathname} from 'next/navigation';
import {useEffect,useId,useRef,useState,useSyncExternalStore,type FormEvent,type KeyboardEvent} from 'react';
import './navbar-search.css';

const historyKey='kuta-recent-searches';
const historyLimit=5;
const mobileQuery='(max-width: 1279px)';

function subscribeToViewport(notify:()=>void){
  const media=window.matchMedia(mobileQuery);
  media.addEventListener('change',notify);
  return ()=>media.removeEventListener('change',notify);
}

function readHistory():string[]{
  try{
    const saved:unknown=JSON.parse(localStorage.getItem(historyKey)??'[]');
    return Array.isArray(saved)?saved.filter((entry):entry is string=>typeof entry==='string'&&!!entry.trim()).slice(0,historyLimit):[];
  }catch{
    return [];
  }
}

function Highlight({label,query}:{label:string;query:string}){
  const start=label.toLowerCase().indexOf(query.toLowerCase());
  if(!query||start<0)return label;
  const end=start+query.length;
  return <>{label.slice(0,start)}<strong>{label.slice(start,end)}</strong>{label.slice(end)}</>;
}

export function NavbarSearch(){
  const pathname=usePathname();
  const mobile=useSyncExternalStore(subscribeToViewport,()=>window.matchMedia(mobileQuery).matches,()=>false);
  if(!pathname||!pathname.replace(/\/+$/,''))return null;
  return <SearchControl key={`${pathname}-${mobile}`} mobile={mobile}/>;
}

function SearchControl({mobile}:{mobile:boolean}){
  const id=useId();
  const root=useRef<HTMLDivElement>(null);
  const input=useRef<HTMLInputElement>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const launch=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false);
  const [value,setValue]=useState('');
  const [history,setHistory]=useState<string[]>([]);
  const [active,setActive]=useState(-1);
  const [result,setResult]=useState<{query:string;items:string[];failed?:boolean}>();
  const query=value.trim();
  const matchingResult=result?.query===query?result:undefined;
  const options=query?matchingResult?.items??[]:history;
  const activeId=options[active]===undefined?undefined:`${id}-option-${active}`;

  useEffect(()=>{
    if(!open||!query)return;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      try{
        const response=await fetch(`/api/papers/suggestions?${new URLSearchParams({q:query})}`,{signal:controller.signal});
        if(!response.ok)throw new Error('Suggestions unavailable');
        const {suggestions}=await response.json() as {suggestions:string[]};
        if(!controller.signal.aborted)setResult({query,items:suggestions});
      }catch{
        if(!controller.signal.aborted)setResult({query,items:[],failed:true});
      }
    },180);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[open,query]);

  useEffect(()=>{
    if(!open||mobile)return;
    const outside=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!root.current?.contains(event.target)){
        input.current?.blur();
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener('pointerdown',outside);
    return ()=>document.removeEventListener('pointerdown',outside);
  },[open,mobile]);

  function expand(){
    if(open)return;
    setHistory(readHistory());
    setOpen(true);
  }

  function close(){
    dialog.current?.close();
    input.current?.blur();
    if(mobile)launch.current?.focus();
    setOpen(false);
    setActive(-1);
  }

  function saveHistory(next:string[]){
    setHistory(next);
    try{localStorage.setItem(historyKey,JSON.stringify(next));}catch{/* Search still works without browser storage. */}
  }

  function submit(text:string){
    const search=text.trim();
    const field=input.current;
    if(!search||!field?.form)return;
    saveHistory([search,...readHistory().filter(item=>item.toLowerCase()!==search.toLowerCase())].slice(0,historyLimit));
    field.value=search;
    field.form.submit();
    close();
  }

  function submitForm(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    submit(options[active]??query);
  }

  function moveSelection(event:KeyboardEvent<HTMLInputElement>){
    if(event.nativeEvent.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
    expand();
    if(!options.length)return;
    event.preventDefault();
    const next=event.key==='ArrowDown'?(active+1)%options.length:(active<=0?options.length-1:active-1);
    setActive(next);
    document.getElementById(`${id}-option-${next}`)?.scrollIntoView({block:'nearest'});
  }

  const message=query
    ? matchingResult?.failed?'Suggestions are unavailable. Press Enter to search.'
      : matchingResult?`No results for “${query}”.`:'Searching…'
    : 'No recent searches.';

  const form=<form role="search" aria-label="Archive search" action="/research-papers" method="get" noValidate onSubmit={submitForm} className="navbar-search-form" data-open={open} onKeyDown={event=>{
    if(open&&event.key==='Escape'&&!event.nativeEvent.isComposing){event.preventDefault();event.stopPropagation();close();}
  }} onBlur={event=>{
    if(!mobile&&event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget)){setOpen(false);setActive(-1);}
  }}>
    <div className="navbar-search-bar">
      {mobile&&<button className="navbar-search-icon" type="button" aria-label="Close search" onClick={close}><ArrowLeft size={20} aria-hidden="true"/></button>}
      <div className="navbar-search-field" data-filled={!!value}>
        <Search size={20} className="navbar-search-glass" aria-hidden="true"/>
        <input ref={input} role="combobox" aria-label="Search KUTA" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-options`} aria-activedescendant={open?activeId:undefined} autoComplete="off" enterKeyHint="search" type="text" name="q" maxLength={100} placeholder="Search KUTA" value={value} onFocus={expand} onClick={expand} onKeyDown={moveSelection} onChange={event=>{
          setValue(event.target.value);setActive(-1);expand();
        }}/>
        {value&&<button type="button" className="navbar-search-icon navbar-search-clear" aria-label="Clear search text" onClick={()=>{setValue('');setActive(-1);input.current?.focus();expand();}}><X size={18} aria-hidden="true"/></button>}
      </div>
    </div>
    <div className="navbar-search-panel" aria-hidden={!open} inert={!open}>
      {!query&&<div className="navbar-search-heading"><span>Recent searches</span>{!!history.length&&<button type="button" onClick={()=>{saveHistory([]);setActive(-1);input.current?.focus();}}>Clear all</button>}</div>}
      {!options.length&&<p className="navbar-search-message" role="status">{message}</p>}
      <div className="navbar-search-choices" data-recent={!query}>
        <div id={`${id}-options`} role="listbox" aria-label={query?'Suggested searches':'Recent searches'} hidden={!options.length}>
          {options.map((option,index)=><div className="navbar-search-option" key={option} id={`${id}-option-${index}`} role="option" aria-selected={active===index} onMouseDown={event=>event.preventDefault()} onClick={()=>submit(option)}>
            {query?<Search size={18} aria-hidden="true"/>:<Clock size={18} aria-hidden="true"/>}
            <span><Highlight label={option} query={query}/></span>
          </div>)}
        </div>
        {!query&&!!history.length&&<div className="navbar-search-removals">{history.map(option=><button key={option} className="navbar-search-icon" type="button" aria-label={`Remove recent search for ${option}`} onClick={()=>{
          saveHistory(history.filter(item=>item!==option));setActive(-1);input.current?.focus();
        }}><X size={16} aria-hidden="true"/></button>)}</div>}
      </div>
    </div>
  </form>;

  return <div className="navbar-search" ref={root}>
    <button ref={launch} className="navbar-search-icon navbar-search-launch" type="button" aria-label="Open search" aria-haspopup="dialog" aria-expanded={mobile&&open} aria-controls={mobile?`${id}-dialog`:undefined} onClick={()=>{
      if(!dialog.current)return;
      dialog.current.showModal();
      input.current?.focus();
      expand();
    }}><Search size={20} aria-hidden="true"/></button>
    {mobile?<dialog ref={dialog} id={`${id}-dialog`} aria-label="Search KUTA" className="navbar-search-dialog" onCancel={event=>{event.preventDefault();close();}}>{form}</dialog>:form}
  </div>;
}
