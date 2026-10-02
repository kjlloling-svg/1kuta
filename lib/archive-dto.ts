import {normalizeKeywords} from './keywords.mjs';
/** Explicit database boundary: never forward SQLite row prototypes or extra fields. */
export type AuthorDTO={name:string;given_name:string|null;family_name:string|null;suffix:string|null};
export type PaperAccess='guest'|'public'|'admin';
export type PaperDTO={id:number;slug:string;title:string;keywords:string[];year:number;program_slug:string;program_name:string;major:string|null;paper_type:string;abstract?:string|null;created_at:string;authors:string|null;status:'pending'|'verified'|'demo';department:string|null;file_name?:string|null};
type Row=Record<string,unknown>;
const text=(value:unknown):string=>value instanceof Date?value.toISOString():value==null?'':String(value);
const optional=(value:unknown):string|null=>value==null?null:text(value);
const number=(value:unknown):number=>{const result=Number(value);if(!Number.isSafeInteger(result))throw new TypeError('Invalid archive integer');return result;};
export function toAuthorDTO(row:Row):AuthorDTO{return {name:text(row.name),given_name:optional(row.given_name),family_name:optional(row.family_name),suffix:optional(row.suffix)};}
/** Server-only metadata; public projection below is the only list/detail API shape. */
export function toPaperDTO(row:Row,access:PaperAccess='guest'):PaperDTO{return {id:number(row.id),slug:text(row.slug),title:text(row.title),keywords:normalizeKeywords(row.keywords),year:number(row.year),program_slug:text(row.program_slug),program_name:text(row.program_name),major:optional(row.major),paper_type:text(row.paper_type),...((access==='public'||access==='admin')?{abstract:optional(row.abstract)}:{}),created_at:text(row.created_at),authors:optional(row.authors),status:row.status==='verified'?'verified':row.status==='demo'?'demo':'pending',department:optional(row.department),...(access==='admin'?{file_name:optional(row.file_name)}:{})};}
export function toPublicPaperDTO(paper:PaperDTO,authors:AuthorDTO[],keywords:string[],access:PaperAccess='guest'){
 const publicFields={id:paper.id,slug:paper.slug,title:paper.title,authors:authors.map(a=>({name:a.name,given:a.given_name||'',family:a.family_name||a.name,suffix:a.suffix})),year:paper.year,program_id:paper.program_slug,program:paper.program_name,keywords:normalizeKeywords(keywords),...((access==='public'||access==='admin')?{abstract:paper.abstract??null}:{}),status:paper.status};
 return access==='admin'?{...publicFields,department:paper.department,category:paper.paper_type,created_at:paper.created_at,has_file:!!paper.file_name}:publicFields;
}
export function toCitationDTO(paper:PaperDTO,authors:AuthorDTO[],access:PaperAccess='guest'){if(access!=='public'&&access!=='admin')throw new Error('Login required for citation');return {title:paper.title,year:paper.year,program:paper.program_name,department:access==='admin'?paper.department:null,keywords:normalizeKeywords(paper.keywords),authors:authors.map(toAuthorDTO)};}

