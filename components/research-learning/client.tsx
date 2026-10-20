'use client';
import {useEffect,useRef,useState,type KeyboardEvent,type ReactNode} from 'react';
import Link from '@/components/native-link';
import {copyCitation} from '@/lib/clipboard.mjs';
import {paperParts,searchLessons,type SampleCitation} from './content';
import {PaperArt} from './paper-art';
import {mountLearningMotion} from './motion';

function Tabs({id,label,items,selected,onSelect}:{id:string;label:string;items:readonly {id:string;label:string}[];selected:number;onSelect:(index:number)=>void}){
 const key=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{let next=index;if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;else if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%items.length;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+items.length-1)%items.length;else return;event.preventDefault();onSelect(next);event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();};
 return <div className="learning-tabs" role="tablist" aria-label={label}>{items.map((item,index)=><button key={item.id} type="button" role="tab" id={`${id}-tab-${item.id}`} aria-controls={`${id}-panel-${item.id}`} aria-selected={selected===index} tabIndex={selected===index?0:-1} onClick={()=>onSelect(index)} onKeyDown={event=>key(event,index)}>{item.label}</button>)}</div>;
}
function Panel({group,id,active,children}:{group:string;id:string;active:boolean;children:ReactNode}){return <div className="learning-panel" role="tabpanel" id={`${group}-panel-${id}`} aria-labelledby={`${group}-tab-${id}`} aria-hidden={!active} inert={!active} tabIndex={active?0:-1} data-active={active}>{children}</div>;}
export function LearningClient({citations}:{citations:SampleCitation[]}){
 const root=useRef<HTMLDivElement>(null),[part,setPart]=useState(0),[lesson,setLesson]=useState(0),[format,setFormat]=useState(0),[notice,setNotice]=useState(''),[copying,setCopying]=useState(false);
 useEffect(()=>{if(root.current)return mountLearningMotion(root.current);},[]);
 const copy=async()=>{if(copying)return;setCopying(true);try{const ok=await copyCitation(citations[format].text,undefined,root.current);setNotice(ok?'Sample citation copied.':'Copy is unavailable. Select the sample citation text and copy it manually.');}catch{setNotice('Copy is unavailable. Select the sample citation text and copy it manually.');}finally{setCopying(false);}};
 return <div ref={root} className="learning-interactive">
 <div className="learning-block learning-anatomy"><div className="learning-block-heading"><span className="learning-step" aria-hidden="true">01</span><div><h3>Anatomy of a research paper</h3><p>Select a part to learn what to look for.</p></div></div>
 <Tabs id="paper-part" label="Parts of a research paper" items={paperParts} selected={part} onSelect={setPart}/>
 <div className="learning-anatomy-layout"><PaperArt selected={paperParts[part].id}/><div className="learning-panel-stack">{paperParts.map((item,index)=><Panel key={item.id} group="paper-part" id={item.id} active={part===index}><span className="learning-connector" aria-hidden="true"/><h4>{item.label}</h4><dl className="learning-explanation"><dt>What it contains</dt><dd>{item.what}</dd><dt>Why it matters</dt><dd>{item.why}</dd><dt>Reading tip</dt><dd>{item.tip}</dd></dl><p className="learning-access"><strong>What you can see here</strong>{item.access}</p></Panel>)}</div></div></div>
 <div className="learning-pair"><div className="learning-block learning-search"><div className="learning-block-heading"><span className="learning-step" aria-hidden="true">02</span><div><h3>Search smarter</h3><p>Small changes make a search more focused.</p></div></div>
 <Tabs id="search-lesson" label="Search examples" items={searchLessons} selected={lesson} onSelect={setLesson}/><p className="learning-caption">Illustrative results only — not live archive results.</p>
 <div className="learning-panel-stack">{searchLessons.map((item,index)=><Panel key={item.id} group="search-lesson" id={item.id} active={lesson===index}><div className="learning-results"><div><h4>Before</h4><p>{item.before}</p><ul>{item.beforeRows.map(row=><li key={row}>{row}</li>)}</ul></div><div><h4>After</h4><p>{item.after}</p><div className="learning-chips" aria-label="Example search terms">{item.chips.map(chip=><span key={chip}>{chip}</span>)}</div><ul>{item.afterRows.map(row=><li key={row}>{row}</li>)}</ul></div></div><p>{item.tip}</p><Link className="text-link learning-link" href={item.href}>{item.link} <span aria-hidden="true">↗</span></Link></Panel>)}</div></div>
 <div className="learning-block learning-cite"><div className="learning-block-heading"><span className="learning-step" aria-hidden="true">03</span><div><h3>Cite it right</h3><p>Credit the source so readers can follow the evidence.</p></div></div><p className="learning-sample-label">Sample only, not an archive record</p>
 <Tabs id="sample-format" label="Sample citation format" items={citations} selected={format} onSelect={index=>{setFormat(index);setNotice('');}}/>
 <div className="learning-key" aria-label="Citation color key">{(['author','year','title','publisher'] as const).map(kind=><span key={kind} data-kind={kind}>{kind}</span>)}</div>
 <div className="learning-panel-stack learning-citations">{citations.map((item,index)=><Panel key={item.id} group="sample-format" id={item.id} active={format===index}><div className="learning-citation" data-format={item.id}>{item.segments.map((segment,i)=><span key={i} data-kind={segment.kind}>{segment.italic?<em>{segment.text}</em>:segment.text}</span>)}</div></Panel>)}</div>
 <button type="button" className="button button-outline learning-copy" disabled={copying} onClick={copy}>{copying?'Copying…':'Copy sample citation'}</button><p className="learning-notice" role="status" aria-live="polite">{notice}</p><Link className="text-link learning-link" href="/login?return_to=%2Fresearch-papers">Sign in with Google to cite real archive papers <span aria-hidden="true">↗</span></Link></div></div>
 <p className="sr-only" aria-live="polite" aria-atomic="true">Selected paper part: {paperParts[part].label}. Search example: {searchLessons[lesson].label}. Sample citation format: {citations[format].label}.</p>
 </div>;
}
