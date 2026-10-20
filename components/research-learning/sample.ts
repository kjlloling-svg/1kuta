import {citationParts,citationStyles,type CitationRecord} from '@/lib/citations';
import {ARCHIVE_NAME,ARCHIVE_PUBLISHER} from '@/lib/site-info.mjs';
import type {SampleCitation,SampleSegment} from './content';
export const sampleTitle='Sample: Exploring quiet spaces for learning';
const publisher='Fictional Learning Institute';
const record:CitationRecord={title:sampleTitle,year:2024,program:'Learning Studies (fictional)',authors:[{name:'Mira Example',given_name:'Mira',family_name:'Example',suffix:null},{name:'Noel Sample',given_name:'Noel',family_name:'Sample',suffix:null}]};
// The shared formatter uses the real archive publisher. Substitute it only in this fictional lesson.
export function sampleCitations():SampleCitation[]{return citationStyles.map(([id,label])=>{
 const parts=citationParts(record,id).map(p=>({...p,text:p.text.replaceAll(ARCHIVE_PUBLISHER,publisher).replaceAll(ARCHIVE_NAME,publisher)}));
 const segments:SampleSegment[]=[];
 const pattern=/Sample: Exploring quiet spaces for learning|Fictional Learning Institute|2024|Mira|Noel|Example|Sample|M\.|N\./g;
 for(const part of parts){let start=0;for(const match of part.text.matchAll(pattern)){if(match.index!>start)segments.push({text:part.text.slice(start,match.index),italic:part.italic});const text=match[0];segments.push({text,kind:text===sampleTitle?'title':text===publisher?'publisher':text==='2024'?'year':'author',italic:part.italic});start=match.index!+text.length;}if(start<part.text.length)segments.push({text:part.text.slice(start),italic:part.italic});}
 return {id,label,text:parts.map(p=>p.text).join(''),segments};
});}
