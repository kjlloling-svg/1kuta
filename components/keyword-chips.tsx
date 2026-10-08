'use client';
import Link from '@/components/native-link';
import {normalizeKeywords} from '@/lib/keywords.mjs';
export function KeywordChips({keywords,limit=4,onKeyword}:{keywords:unknown;limit?:number;onKeyword?:(keyword:string)=>void}){
 const words=normalizeKeywords(keywords);if(!words.length)return null;
 const shown=words.slice(0,limit),more=words.length-shown.length;
 const chip=(word:string,label:string)=>onKeyword?<button type="button" className="keyword-chip" key={word} title={word} aria-label={'Filter research by '+word} onClick={()=>onKeyword(word)}>{label}</button>:<Link className="keyword-chip" key={word} title={word} href={'/research-papers?'+new URLSearchParams({keyword:word})} aria-label={'Filter research by '+word}>{label}</Link>;
 return <div className="card-keywords" aria-label="Research keywords">{shown.map(word=>chip(word,word))}{more>0&&chip(words[limit],`+${more} more`)}</div>;
}
