import {toAuthorDTO,toPaperDTO,toPublicPaperDTO,type PaperDTO,type AuthorDTO,type PaperAccess} from './archive-dto';
import { env } from '@/lib/local-env';
import { programs as catalog, canonicalProgram } from './programs';

export type Paper=PaperDTO;
export type PaperAuthor=AuthorDTO;
export type SearchFilters = {q?:string;author?:string;keyword?:string;program?:string;year?:number;page?:number;sort?:string;access?:PaperAccess};
export const database = () => { if(!env.DB) throw new Error('Archive database is unavailable'); return env.DB as unknown as D1Database; };
const from = 'FROM research_papers p JOIN programs g ON g.id=p.program_id';
const baseFields = `p.id,p.slug,p.title,p.keywords,p.year,p.paper_type,p.created_at,p.status,p.department,g.slug AS program_slug,g.name AS program_name,g.major,
  (SELECT group_concat(name, ', ') FROM (SELECT a.name FROM research_paper_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.paper_id=p.id ORDER BY pa.position)) AS authors`;
const fieldsFor=(access:PaperAccess)=>baseFields+((access==='public'||access==='admin')?',p.abstract':'')+(access==='admin'?',p.file_name':'');
export {normalizeKeywords as keywordsOf} from './keywords.mjs';
import {normalizeKeywords as keywordsOf} from './keywords.mjs';
export async function stats() {
  const result=await database().prepare("SELECT COUNT(*) AS papers, COUNT(DISTINCT year) AS years FROM research_papers WHERE status='verified'").first<{papers:number;years:number}>();
  const author=await database().prepare("SELECT COUNT(DISTINCT pa.author_id) AS authors FROM research_paper_authors pa JOIN research_papers p ON p.id=pa.paper_id WHERE p.status='verified'").first<{authors:number}>();
  return {papers:result?.papers??0,years:result?.years??0,authors:author?.authors??0};
}
export async function searchPapers(filters:SearchFilters) {
  const clauses=[filters.access==='admin'?'1=1':"p.status IN ('verified','demo')"];
  const binds:(string|number)[]=[];
  const add=(sql:string,value:string|number)=>{clauses.push(sql);binds.push(value);};
  if(filters.program)add('g.slug=?',canonicalProgram(filters.program));
  if(filters.year)add('p.year=?',filters.year);
  const term=(s?:string)=>s?.trim().slice(0,100);
  if(term(filters.q)){
    clauses.push(`(p.title LIKE ? OR p.keywords LIKE ? OR g.name LIKE ? OR g.major LIKE ? OR EXISTS (SELECT 1 FROM research_paper_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.paper_id=p.id AND a.name LIKE ?))`);
    binds.push(...Array(5).fill(`%${term(filters.q)}%`));
  }
  if(term(filters.author))add('EXISTS (SELECT 1 FROM research_paper_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.paper_id=p.id AND a.name LIKE ?)',`%${term(filters.author)}%`);
  if(term(filters.keyword))add('p.keywords LIKE ?',`%${term(filters.keyword)}%`);
  const where=` WHERE ${clauses.join(' AND ')}`;
  const count=await database().prepare(`SELECT COUNT(*) AS total ${from}${where}`).bind(...binds).first<{total:number}>();
  const page=Math.max(1,Math.min(10000,filters.page||1));
  const order=filters.sort==='oldest'?'p.year ASC,p.title ASC':filters.sort==='recent'?'p.created_at DESC,p.id DESC':'p.year DESC,p.title ASC';
  const rows=await database().prepare(`SELECT ${fieldsFor(filters.access||'guest')} ${from}${where} ORDER BY ${order} LIMIT 12 OFFSET ?`).bind(...binds,(page-1)*12).all<Paper>();
  return {papers:rows.results.map(row=>toPaperDTO(row,filters.access)),total:count?.total??0,page,pages:Math.ceil((count?.total??0)/12)};
}
export async function recentPapers(access:PaperAccess='guest'){
  const rows=await database().prepare(`SELECT ${fieldsFor(access)} ${from} WHERE p.status='verified' ORDER BY p.created_at DESC,p.id DESC LIMIT 3`).all<Paper>();
  return rows.results.map(row=>toPaperDTO(row,access));
}
export async function getPaper(id:string,access:PaperAccess='guest'){
  const constraint=access==='admin'?'':" AND p.status IN ('verified','demo')";
  const row=await database().prepare(`SELECT ${fieldsFor(access)} ${from} WHERE (p.slug=? OR CAST(p.id AS TEXT)=?)${constraint} LIMIT 1`).bind(id,id).first<Paper>();
  return row?toPaperDTO(row,access):null;
}
export async function getPaperAuthors(paperId:number){
  const rows=await database().prepare('SELECT a.name,a.given_name,a.family_name,a.suffix FROM research_paper_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.paper_id=? ORDER BY pa.position,a.id').bind(paperId).all<PaperAuthor>();
  return rows.results.map(toAuthorDTO);
}
export async function getProtectedAbstract(slug:string,access:PaperAccess='guest'){
  if(access==='guest')return null;
  const row=await database().prepare("SELECT abstract FROM research_papers WHERE slug=? AND status IN ('verified','demo') LIMIT 1").bind(slug).first<{abstract:string|null}>();
  return row?{abstract:row.abstract==null?null:String(row.abstract)}:null;
}
export async function getProtectedSections(id:string){
  const row=await database().prepare("SELECT full_text FROM research_papers WHERE (slug=? OR CAST(id AS TEXT)=?) LIMIT 1").bind(id,id).first<{full_text:string|null}>();
  return row?{full_text:row.full_text==null?null:String(row.full_text)}:null;
}
export async function allPrograms(){
  await ensurePrograms();
  const rows=await database().prepare('SELECT id,slug,name,major,description FROM programs ORDER BY id').all<{id:number;slug:string;name:string;major:string|null;description:string|null}>();
  return rows.results.map(row=>({id:Number(row.id),slug:String(row.slug),name:String(row.name),major:row.major==null?null:String(row.major),description:row.description==null?null:String(row.description)})).sort((a,b)=>catalog.findIndex(p=>p.slug===a.slug)-catalog.findIndex(p=>p.slug===b.slug));
}
export async function ensurePrograms(){
  const db=database();
  const existing=await db.prepare('SELECT slug FROM programs').all<{slug:string}>();
  const slugs=new Set(existing.results.map(p=>p.slug));
  const missing=catalog.filter(p=>!slugs.has(p.slug));
  if(!missing.length)return;
  await db.batch(missing.map(p=>db.prepare('INSERT OR IGNORE INTO programs (slug,name,major,description) VALUES (?,?,?,?)').bind(p.slug,p.name,p.major,`${p.label} research at SLSU Gumaca Campus`)));
}
export async function allKeywords(){
  const rows=await database().prepare("SELECT keywords FROM research_papers WHERE status IN ('verified','demo')").all<{keywords:string|null}>();
  return [...new Set(rows.results.flatMap(row=>keywordsOf(row.keywords)))].sort((a,b)=>a.localeCompare(b));
}
export async function publicPaper(paper:Paper,access:PaperAccess='guest'){
  const authors=await getPaperAuthors(paper.id);
  return toPublicPaperDTO(paper,authors,keywordsOf(paper.keywords),access);
}





