import {paperInput,type PaperInput} from './record-validation.ts';
export class DuplicatePaperError extends Error {constructor(){super('A record with this title, year, and program already exists.');}}
export function slugify(title:string,year:number){return `${title.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)}-${year}-${crypto.randomUUID()}`;}
export async function findDuplicate(db:D1Database,input:PaperInput,exclude=0){
 return db.prepare('SELECT id FROM research_papers WHERE trim(title)=? COLLATE NOCASE AND year=? AND program_id=? AND id<>? LIMIT 1').bind(input.title,input.year,input.program_id,exclude).first<{id:number}>();
}
export async function writePaper(db:D1Database,raw:PaperInput,existingId?:number){
 const input=paperInput.parse(raw),now=new Date().toISOString();
 if(!await db.prepare('SELECT id FROM programs WHERE id=?').bind(input.program_id).first())throw new Error('Select a valid program');
 const existing=existingId?await db.prepare('SELECT title,year,program_id FROM research_papers WHERE id=?').bind(existingId).first<{title:string;year:number;program_id:number}>():null;
 // Historical duplicates remain editable when their identity is unchanged.
 const identityChanged=!existing||existing.title.trim().toLowerCase()!==input.title.toLowerCase()||existing.year!==input.year||existing.program_id!==input.program_id;
 if(identityChanged&&await findDuplicate(db,input,existingId))throw new DuplicatePaperError();
 const values=[input.title,input.abstract||null,JSON.stringify(input.keywords),input.year,input.program_id,'Research Paper',input.status,now];
 const slug=existingId?null:slugify(input.title,input.year),ops:D1PreparedStatement[]=[];
 // Conditional insert and author links share one write transaction, protecting retries.
 if(slug)ops.push(db.prepare('INSERT INTO research_papers (slug,title,abstract,keywords,year,program_id,paper_type,status,updated_at,created_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM research_papers WHERE trim(title)=? COLLATE NOCASE AND year=? AND program_id=?)').bind(slug,...values,now,input.title,input.year,input.program_id));
 else ops.push(db.prepare("UPDATE research_papers SET title=?,abstract=?,keywords=?,year=?,program_id=?,paper_type=?,status=CASE WHEN status='demo' THEN status ELSE ? END,updated_at=? WHERE id=?").bind(...values,existingId!));
 const match=slug?'slug=?':'id=?',key=slug||existingId!;
 ops.push(db.prepare(`DELETE FROM research_paper_authors WHERE paper_id=(SELECT id FROM research_papers WHERE ${match})`).bind(key));
 input.authors.forEach((author,index)=>{
  ops.push(db.prepare(`INSERT INTO authors (name,given_name,family_name) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM research_papers WHERE ${match}) AND NOT EXISTS (SELECT 1 FROM authors WHERE given_name=? AND family_name=?)`).bind(`${author.given} ${author.family}`,author.given,author.family,key,author.given,author.family));
  ops.push(db.prepare(`INSERT INTO research_paper_authors (paper_id,author_id,position) SELECT p.id,(SELECT id FROM authors WHERE given_name=? AND family_name=? ORDER BY id LIMIT 1),? FROM research_papers p WHERE p.${match}`).bind(author.given,author.family,index,key));
 });
 const results=await db.batch(ops);
 if(!results[0].meta.changes){if(slug)throw new DuplicatePaperError();throw new Error('Record not found');}
 return existingId||(await db.prepare('SELECT id FROM research_papers WHERE slug=?').bind(slug).first<{id:number}>())!.id;
}
