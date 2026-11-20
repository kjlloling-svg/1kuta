'use client';
import Link from '@/components/native-link';
import {normalizeKeywords} from '@/lib/keywords.mjs';
import {useState} from 'react';
export function KeywordChips({keywords,limit=4,onKeyword}:{keywords:unknown;limit?:number;onKeyword?:(keyword:string)=>void}){
 const [expanded,setExpanded]=useState(false);
 const words=normalizeKeywords(keywords);if(!words.length)return null;
 const more=words.length-limit;
 const shown=expanded?words:words.slice(0,limit);
 const chip=(word:string)=>onKeyword?<button type="button" className="keyword-chip" key={word} title={word} aria-label={'Filter research by '+word} onClick={()=>onKeyword(word)}>{word}</button>:<Link className="keyword-chip" key={word} title={word} href={'/research-papers?'+new URLSearchParams({keyword:word})} aria-label={'Filter research by '+word}>{word}</Link>;
 return <div className={`card-keywords${expanded?' card-keywords-expanded':''}`} role="group" aria-label="Research keywords">
  {shown.map(chip)}
  {more>0&&<button type="button" className="keyword-chip" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>
    {expanded?'Show fewer':`+${more} more`}
  </button>}
 </div>;
}
