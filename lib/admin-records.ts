import {database} from './archive';
import {programs} from './programs';
import {normalizeKeywords} from './keywords.mjs';

export type ReviewFilter={q:string;status:'all'|'pending'|'verified';program:string;page:number};
export function reviewFilter(params:URLSearchParams):ReviewFilter{
 const status=params.get('status')||'pending',program=params.get('program')||'';
 return {q:(params.get('q')||'').trim().slice(0,200),status:status==='all'||status==='verified'?status:'pending',program:program==='uncategorized'||programs.some(p=>p.slug===program)?program:'',page:Math.max(1,Math.min(10000,Number(params.get('page'))||1))|0};
}
// Catalog constants only; request values are always bound separately.
const group=`CASE WHEN g.slug IN (${programs.map(p=>`'${p.slug}'`).join(',')}) THEN g.slug ELSE 'uncategorized' END`;
const from='FROM research_papers p LEFT JOIN programs g ON g.id=p.program_id';
function where(filter:ReviewFilter,facet?:'status'|'program'){
 const clauses:string[]=[],values:(string|number)[]=[];
 if(filter.q){
  const value='%'+filter.q.replace(/[\\%_]/g,'\\$&')+'%';
  clauses.push(`(p.title LIKE ? ESCAPE '\\' COLLATE NOCASE OR p.keywords LIKE ? ESCAPE '\\' COLLATE NOCASE OR g.name LIKE ? ESCAPE '\\' COLLATE NOCASE OR g.major LIKE ? ESCAPE '\\' COLLATE NOCASE OR g.slug LIKE ? ESCAPE '\\' COLLATE NOCASE OR CAST(p.year AS TEXT) LIKE ? ESCAPE '\\' OR EXISTS(SELECT 1 FROM research_paper_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.paper_id=p.id AND a.name LIKE ? ESCAPE '\\' COLLATE NOCASE))`);
  values.push(...Array(7).fill(value));
 }
 if(facet!=='status'&&filter.status!=='all'){clauses.push('p.status=?');values.push(filter.status);}
 if(facet!=='program'&&filter.program){clauses.push(`${group}=?`);values.push(filter.program);}
 return {sql:clauses.length?' WHERE '+clauses.join(' AND '):'',values};
}
export async function adminRecords(filter:ReviewFilter){
 const db=database(),match=where(filter),statusMatch=where(filter,'status'),programMatch=where(filter,'program');
 const [count,statusRows,programRows]=await Promise.all([
  db.prepare(`SELECT COUNT(*) n ${from}${match.sql}`).bind(...match.values).first<{n:number}>(),
  db.prepare(`SELECT p.status,COUNT(*) n ${from}${statusMatch.sql} GROUP BY p.status`).bind(...statusMatch.values).all<{status:string;n:number}>(),
  db.prepare(`SELECT ${group} program,COUNT(*) n ${from}${programMatch.sql} GROUP BY ${group}`).bind(...programMatch.values).all<{program:string;n:number}>(),
 ]);
 const total=Number(count?.n||0),pages=Math.max(1,Math.ceil(total/20)),page=Math.min(filter.page,pages);
 const rows=await db.prepare(`SELECT p.id,p.slug,p.title,p.status,p.year,p.keywords,p.file_name,${group} program_id,COALESCE(g.name,'Uncategorized') program,(SELECT group_concat(a.name,', ') FROM research_paper_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.paper_id=p.id) authors ${from}${match.sql} ORDER BY CASE WHEN p.status='pending' THEN 0 ELSE 1 END,p.year DESC,p.id DESC LIMIT 20 OFFSET ?`).bind(...match.values,(page-1)*20).all<Record<string,unknown>>();
 const statuses={all:0,pending:0,verified:0};
 statusRows.results.forEach(row=>{statuses.all+=Number(row.n);if(row.status==='pending'||row.status==='verified')statuses[row.status]=Number(row.n);});
 return {papers:rows.results.map(row=>({id:Number(row.id),slug:String(row.slug),title:String(row.title),status:String(row.status),year:Number(row.year),program_id:String(row.program_id),program:String(row.program),authors:String(row.authors||''),keywords:normalizeKeywords(row.keywords),has_file:!!row.file_name})),total,pages,page,statuses,programs:programs.map<{slug:string;label:string;count:number}>(p=>({slug:p.slug,label:p.label,count:Number(programRows.results.find(r=>r.program===p.slug)?.n||0)})).concat({slug:'uncategorized',label:'Uncategorized',count:Number(programRows.results.find(r=>r.program==='uncategorized')?.n||0)})};
}

