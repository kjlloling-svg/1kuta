import Link from '@/components/native-link';
import {normalizeKeywords} from '@/lib/keywords.mjs';
export function KeywordChips({keywords,limit=4}:{keywords:unknown;limit?:number}){
 const words=normalizeKeywords(keywords);if(!words.length)return null;
 const shown=words.slice(0,limit),more=words.length-shown.length;
 return <div className="card-keywords" aria-label="Research keywords">{shown.map(word=><Link className="keyword-chip" key={word} href={'/research-papers?'+new URLSearchParams({keyword:word})} aria-label={'Filter research by '+word}>{word}</Link>)}{more>0&&<Link className="keyword-chip more-keywords" href={'/research-papers?'+new URLSearchParams({keyword:words[limit]})} aria-label={'Show another keyword: '+words[limit]}>+{more} more</Link>}</div>;
}
