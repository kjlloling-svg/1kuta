import {normalizeKeywords} from './keywords.mjs';
import { z } from 'zod';
import { database } from './archive';
const short=z.string().trim().min(1).max(300);
export const paperInput=z.object({title:short,authors:z.array(z.object({given:short.max(100),family:short.max(100)}).strict()).min(1).max(30),program_id:z.number().int().positive(),year:z.number().int().min(2009).max(new Date().getFullYear()),department:z.string().trim().max(1000).optional().nullable(),category:short.max(100),keywords:z.union([z.string().max(5000),z.array(z.string().max(80)).max(30)]).transform(normalizeKeywords).pipe(z.array(short.max(80)).max(30)),abstract:z.string().trim().max(15000).optional().nullable(),status:z.enum(['pending','verified','demo']).default('pending')}).strict();
export type PaperInput=z.infer<typeof paperInput>;
export function slugify(title:string,year:number){return `${title.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)}-${year}-${crypto.randomUUID().slice(0,8)}`;}
export async function readPaperInput(request:Request){if(Number(request.headers.get('content-length')||0)>150000)throw new Error('Record exceeds the allowed size');const raw=await request.text();if(raw.length>150000)throw new Error('Record exceeds the allowed size');return paperInput.parse(JSON.parse(raw));}
export async function savePaper(input:PaperInput,existingId?:number){
 const db=database(),now=new Date().toISOString();
 if(!await db.prepare('SELECT id FROM programs WHERE id=?').bind(input.program_id).first())throw new Error('Select a valid program');
 const values=[input.title,input.abstract||null,JSON.stringify(normalizeKeywords(input.keywords)),input.year,input.program_id,input.category,input.department||null,input.status,now];
 const slug=existingId?null:slugify(input.title,input.year),ops:D1PreparedStatement[]=[];
 if(slug)ops.push(db.prepare('INSERT INTO research_papers (slug,title,abstract,keywords,year,program_id,paper_type,department,status,updated_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(slug,...values,now));
 else ops.push(db.prepare('UPDATE research_papers SET title=?,abstract=?,keywords=?,year=?,program_id=?,paper_type=?,department=?,status=?,updated_at=? WHERE id=?').bind(...values,existingId!));
 const match=slug?'slug=?':'id=?',key=slug||existingId!;
 ops.push(db.prepare(`DELETE FROM research_paper_authors WHERE paper_id=(SELECT id FROM research_papers WHERE ${match})`).bind(key));
 input.authors.forEach((author,index)=>{
 ops.push(db.prepare('INSERT INTO authors (name,given_name,family_name) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM authors WHERE given_name=? AND family_name=?)').bind(`${author.given} ${author.family}`,author.given,author.family,author.given,author.family));
 ops.push(db.prepare(`INSERT INTO research_paper_authors (paper_id,author_id,position) VALUES ((SELECT id FROM research_papers WHERE ${match}),(SELECT id FROM authors WHERE given_name=? AND family_name=? ORDER BY id LIMIT 1),?)`).bind(key,author.given,author.family,index));
 });
 await db.batch(ops);return existingId||(await db.prepare('SELECT id FROM research_papers WHERE slug=?').bind(slug).first<{id:number}>())!.id;
}

