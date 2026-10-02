import {normalizeKeywords} from './keywords.mjs';
import { ARCHIVE_NAME,ARCHIVE_PUBLISHER } from './site-info.mjs';
export type CitationAuthor={name:string;given_name:string|null;family_name:string|null;suffix:string|null};
export type CitationRecord={title:string;year:number|null;program?:string|null;department?:string|null;keywords?:string[];authors:CitationAuthor[]};
export type CitationStyle='apa'|'mla'|'chicago'|'harvard'|'ieee'|'vancouver'|'bibtex'|'ris';
export const citationStyles:[CitationStyle,string][]=[['apa','APA 7th edition'],['mla','MLA 9th edition'],['chicago','Chicago'],['harvard','Harvard'],['ieee','IEEE'],['vancouver','Vancouver'],['bibtex','BibTeX'],['ris','RIS']];
export type CitationPart={text:string;italic?:boolean};
const clean=(s:string)=>s.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
const end=(s:string)=>/[.!?]$/.test(s)?s:s+'.';
export function authorParts(author:CitationAuthor){
 if(author.family_name?.trim())return {family:clean(author.family_name),given:clean(author.given_name||''),suffix:clean(author.suffix||''),uncertain:false};
 const name=clean(author.name),comma=name.indexOf(',');
 if(comma>0)return {family:name.slice(0,comma).trim(),given:name.slice(comma+1).trim(),suffix:clean(author.suffix||''),uncertain:true};
 const words=name.split(' '),family=words.pop()||name;
 return {family,given:words.join(' '),suffix:clean(author.suffix||''),uncertain:true};
}
const initials=(s:string,dotted=true)=>s.split(/[\s-]+/).filter(Boolean).map(w=>w[0].toUpperCase()+(dotted?'.':'')).join(dotted?' ':'');
function authorName(a:CitationAuthor,mode:'initials'|'full'|'forward'|'compact',reverse=true){const p=authorParts(a),given=mode==='full'?p.given:initials(p.given,mode!=='compact'),suffix=p.suffix?` ${p.suffix}`:'';if(mode==='compact')return `${p.family} ${given}${suffix}`.trim();if(mode==='forward'||!reverse)return `${mode==='full'?p.given:given} ${p.family}${suffix}`.trim();return `${p.family}${given?`, ${given}`:''}${p.suffix?`, ${p.suffix}`:''}`;}
function joinNames(names:string[],conjunction:string,oxford=true){if(names.length<2)return names[0]||'';if(names.length===2)return names.join(` ${conjunction} `);return `${names.slice(0,-1).join(', ')}${oxford?',':''} ${conjunction} ${names.at(-1)}`;}
function names(authors:CitationAuthor[],style:CitationStyle){
 if(style==='mla')return authors.length>2?`${authorName(authors[0],'full')}, et al.`:joinNames(authors.map((a,i)=>authorName(a,'full',i===0)),'and');
 if(style==='chicago'){const list=authors.length>6?authors.slice(0,3):authors;const text=joinNames(list.map((a,i)=>authorName(a,'full',i===0)),'and');return authors.length>6?`${text}, et al.`:text;}
 if(style==='ieee')return authors.length>6?`${authorName(authors[0],'forward')}, et al.`:joinNames(authors.map(a=>authorName(a,'forward')),'and');
 if(style==='vancouver'){const list=authors.slice(0,6).map(a=>authorName(a,'compact')).join(', ');return authors.length>6?`${list}, et al.`:list;}
 const list=authors.map(a=>authorName(a,'initials'));
 if(style==='apa'&&list.length>20)return `${list.slice(0,19).join(', ')}, … ${list.at(-1)}`;
 if(style==='apa'&&list.length===2)return list[0]+', & '+list[1];
 return joinNames(list,style==='apa'?'&':'and',style==='apa');
}
const tex=(value:string)=>clean(value).replace(/[\\{}%&_$#]/g,c=>c==='\\'?'\\textbackslash{}':`\\${c}`);
export function citationParts(record:CitationRecord,style:CitationStyle,referenceNumber=1):CitationPart[]{
 const title=clean(record.title),year=record.year?String(record.year):'n.d.',people=names(record.authors,style),field=clean(record.program||record.department||''),descriptor=field?`Research paper, ${field}`:'Research paper';
 if(style==='bibtex'){
 const key=`${record.authors[0]?authorParts(record.authors[0]).family:'kuta'}${record.year||'nd'}`.normalize('NFKD').replace(/[^a-zA-Z0-9]/g,'')||'kuta';
 return [{text:`@misc{${key},\n${record.authors.length?`  author = {${record.authors.map(a=>{const p=authorParts(a);return tex(p.family)+(p.suffix?`, ${tex(p.suffix)}, ${tex(p.given)}`:p.given?`, ${tex(p.given)}`:'');}).join(' and ')}},\n`:''}  title = {${tex(title)}},\n${record.year?`  year = {${record.year}},\n`:''}  publisher = {${tex(ARCHIVE_PUBLISHER)}},\n  howpublished = {${tex(ARCHIVE_NAME)}},\n${normalizeKeywords(record.keywords).length?`  keywords = {${tex(normalizeKeywords(record.keywords).join(', '))}},\n`:''}  note = {${tex(descriptor)}}\n}`}];
 }
 if(style==='ris')return [{text:['TY  - RPRT',...record.authors.map(a=>{const p=authorParts(a);return `AU  - ${p.family}${p.given?`, ${p.given}`:''}${p.suffix?`, ${p.suffix}`:''}`;}),`TI  - ${title}`,...(record.year?[`PY  - ${record.year}`]:[]),`PB  - ${ARCHIVE_PUBLISHER}`,`T2  - ${ARCHIVE_NAME}`,`N1  - ${descriptor}`,...normalizeKeywords(record.keywords).map(k=>`KW  - ${clean(k)}`),'ER  - '].join('\n')}];
 if(style==='mla')return [{text:people?`${end(people)} `:''},{text:`“${title.replace(/[.\s]+$/,'')}.” `},{text:ARCHIVE_NAME,italic:true},{text:`, ${year}. ${end(field||'Research paper')}`}];
 if(style==='chicago')return [{text:people?`${end(people)} `:''},{text:title,italic:true},{text:`. ${end(descriptor)} ${ARCHIVE_PUBLISHER}, ${year}.`}];
 if(style==='harvard')return [{text:people?`${people} (${year}) `:''},{text:title,italic:true},{text:`. ${end(descriptor)} ${ARCHIVE_PUBLISHER}${people?'.':`, ${year}.`}`}];
 if(style==='ieee')return [{text:`[${referenceNumber}] `},{text:people?`${people}, `:''},{text:`“${title.replace(/[.\s]+$/,'')},” ${descriptor}, `},{text:ARCHIVE_NAME,italic:true},{text:`, ${year}.`}];
 if(style==='vancouver')return [{text:`${referenceNumber}. ${people?`${end(people)} `:''}${end(title)} ${end(descriptor)} ${ARCHIVE_PUBLISHER}; ${year}.`}];
 return [{text:people?`${end(people)} (${year}). `:''},{text:title.replace(/[.\s]+$/,''),italic:true},{text:` [${descriptor}].${people?'':` (${year}).`} ${ARCHIVE_PUBLISHER}.`}];
}
export function citation(record:CitationRecord,style:CitationStyle,referenceNumber=1){return citationParts(record,style,referenceNumber).map(p=>p.text).join('');}
export function citationHasUncertainNames(authors:CitationAuthor[]){return authors.some(a=>authorParts(a).uncertain);}
export function inTextAPA(record:CitationRecord){const families=record.authors.map(a=>authorParts(a).family);return `(${families.length>2?`${families[0]} et al.`:families.join(' & ')||record.title}, ${record.year||'n.d.'})`;}



