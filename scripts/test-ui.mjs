import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {sqlite} from './local-database.mjs';
import {toAuthorDTO,toPaperDTO,toPublicPaperDTO,toCitationDTO} from '../lib/archive-dto.ts';
import {citation,citationStyles} from '../lib/citations.ts';
const marker=randomUUID(),userId=randomUUID(),password=randomBytes(20).toString('hex'),base='http://localhost:3000';
const papers=[],authors=[];
const request=(url,cookie='')=>fetch(base+url,{headers:cookie?{Cookie:cookie}:{}});
sqlite.prepare('INSERT INTO users(id,email,name,role,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?,?)').run(userId,marker+'@kuta.local','DTO verifier','admin',await bcrypt.hash(password,12),'',Date.now()/1000|0);
function plain(value){if(value&&typeof value==='object'){assert.equal(Object.getPrototypeOf(value),Array.isArray(value)?Array.prototype:Object.prototype);for(const v of Object.values(value))plain(v);}}
try{
 const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({identifier:marker+'@kuta.local',password})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 const program=sqlite.prepare('SELECT id,name,slug FROM programs LIMIT 1').get();
 const cases=[['one',[['Ana','Reyes',null]]],['several',[['Ana','Reyes',null],['Ben','Cruz',null],['Cara','Lim',null]]],['suffix',[['Alexis','Dela Cruz','Jr.']]],['missing optional',[[null,null,null]]]];
 for(const [label,names] of cases){
  const slug='dto-'+label.replaceAll(' ','-')+'-'+marker;const result=sqlite.prepare('INSERT INTO research_papers(slug,title,year,program_id,abstract,status,full_text) VALUES(?,?,?,?,?,?,?)').run(slug,'DTO test '+label,2026,program.id,'Public DTO abstract','demo','PRIVATE_DTO_SENTINEL');const id=Number(result.lastInsertRowid);papers.push(id);
  for(const [position,[given,family,suffix]] of names.entries()){const a=sqlite.prepare('INSERT INTO authors(name,given_name,family_name,suffix) VALUES(?,?,?,?)').run((given||'Legacy')+' '+(family||marker),given,family,suffix);const aid=Number(a.lastInsertRowid);authors.push(aid);sqlite.prepare('INSERT INTO research_paper_authors(paper_id,author_id,position) VALUES(?,?,?)').run(id,aid,position);}
  const row=sqlite.prepare('SELECT a.name,a.given_name,a.family_name,a.suffix FROM authors a JOIN research_paper_authors pa ON a.id=pa.author_id WHERE pa.paper_id=? ORDER BY position').all(id);assert.equal(Object.getPrototypeOf(row[0]),null);const authorDTO=row.map(toAuthorDTO);plain(authorDTO);
  const p=toPaperDTO(Object.assign(Object.create(null),{id:BigInt(id),slug,title:'DTO test '+label,year:2026,program_name:program.name,program_slug:program.slug,status:'demo',created_at:new Date('2026-01-01'),abstract:'Public DTO abstract',full_text:'PRIVATE_DTO_SENTINEL'}),'public');plain(p);assert.equal(p.created_at,'2026-01-01T00:00:00.000Z');const pub=toPublicPaperDTO(p,authorDTO,[],'guest');plain(pub);assert.equal(Object.hasOwn(pub,'full_text'),false);const cite=toCitationDTO(p,authorDTO,'public');plain(cite);for(const [style] of citationStyles){const text=citation(cite,style);assert.ok(text.includes(p.title));assert.ok(!text.includes('undefined'));if(label==='suffix'){assert.ok(text.includes('Jr.'));if(style==='bibtex')assert.ok(text.includes('Dela Cruz, Jr., Alexis'));}}
  for(const [role,session] of [['visitor',''],['admin',cookie]]){const res=await request('/research-papers/'+slug,session),html=await res.text();assert.equal(res.status,200,label+' '+role);assert.equal(html.includes('Public DTO abstract'),role==='admin');assert.ok(!html.includes('Only plain objects'));assert.ok(!html.includes('PRIVATE_DTO_SENTINEL'));assert.equal(html.includes('View full paper'),role==='admin');console.log('PASS: '+role+' details: '+label+' author(s), citation DTO and private-field boundary');}
 }
 for(const route of ['/','/research-papers','/programs','/about','/faq','/login','/admin']){const res=await request(route,cookie);assert.equal(res.status,200,route);const html=await res.text();assert.ok(html.includes('Page scroll progress'));assert.equal(html.includes('kuta-locality.webp'),route==='/');console.log('PASS: '+route+' includes progress; locality image only on homepage');}
}finally{for(const id of papers){sqlite.prepare('DELETE FROM research_paper_authors WHERE paper_id=?').run(id);sqlite.prepare('DELETE FROM research_papers WHERE id=?').run(id);}for(const id of authors)sqlite.prepare('DELETE FROM authors WHERE id=?').run(id);sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);sqlite.prepare('DELETE FROM users WHERE id=?').run(userId);}
