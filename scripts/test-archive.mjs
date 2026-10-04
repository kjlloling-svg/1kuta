import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {newSession,SESSION_COOKIE} from '../lib/google-session.mjs';
import {sqlite} from './local-database.mjs';
import {migrateArchive} from './migrate-archive.mjs';
import {citation,citationParts,citationStyles} from '../lib/citations.ts';
import {copyCitation} from '../lib/clipboard.mjs';
const base=`http://localhost:${process.env.PORT||3000}`;
const marker=randomUUID(),password=randomBytes(20).toString('hex'),adminId=randomUUID(),publicId=randomUUID();
let created=[],defaultCookie='';
for(const [id,role] of [[adminId,'admin'],[publicId,'public']])sqlite.prepare('INSERT INTO users (id,email,name,role,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?,?)').run(id,`${role}-${marker}@kuta.local`,'Verification '+role,role,'','',Math.floor(Date.now()/1000));
async function call(url,{method='GET',body,cookie=defaultCookie,headers={}}={}){return fetch(base+url,{method,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),redirect:'manual'});}
async function check(label,fn){await fn();console.log('PASS: '+label);}
async function login(role){const id=role==='admin'?adminId:publicId;sqlite.prepare('UPDATE users SET google_sub=? WHERE id=?').run(id,id);return SESSION_COOKIE+'='+await newSession(id);}
function restricted(p,authenticated){for(const key of ['file_key','file_name','file_size','file_url','full_text','sections','institution','adviser','publication_url','doi','department','category','created_at','has_file'])assert.equal(Object.hasOwn(p,key),false,key+' leaked');assert.equal(Object.hasOwn(p,'abstract'),authenticated);if(authenticated)assert.equal(typeof p.abstract,'string');}
try{
 const admin=await login('admin'),publicCookie=await login('public');defaultCookie=publicCookie;
 const programs=(await (await call('/api/programs')).json()).programs;
 await check('Five programs; Nursing/Midwifery appears once',async()=>{assert.equal(programs.length,5);assert.equal(programs.filter(p=>p.slug==='bs-nursing-midwifery').length,1);assert.equal(programs.some(p=>['bs-nursing','diploma-midwifery'].includes(p.slug)),false);});
 const program=programs.find(p=>p.slug==='bs-nursing-midwifery');
 const body={title:`DEMO QA ${marker}`,authors:[{given:'Ana Maria',family:'Dela Cruz'},{given:'Ben',family:'Reyes'}],program_id:program.id,year:2026,department:'Private department',category:'Research Paper',keywords:' Local QA, local qa, Archives, Design, Education, Campus, Technology ',abstract:'Public verification abstract.',status:'demo'};
 let id,slug;
 await check('Admin adds paper',async()=>{const r=await call('/api/papers',{method:'POST',cookie:admin,body});assert.equal(r.status,201);id=(await r.json()).id;created.push(id);slug=sqlite.prepare('SELECT slug FROM research_papers WHERE id=?').get(id).slug;sqlite.prepare('UPDATE research_papers SET full_text=? WHERE id=?').run('PRIVATE_FULL_TEXT_SENTINEL',id);});
 await check('Comma keyword input is deduplicated, stored as JSON and searchable',async()=>{assert.equal(sqlite.prepare('SELECT keywords FROM research_papers WHERE id=?').get(id).keywords,'["Local QA","Archives","Design","Education","Campus","Technology"]');const r=await (await call('/api/papers?keyword=Campus&q='+marker)).json();assert.equal(r.papers.length,1);assert.deepEqual(r.papers[0].keywords,['Local QA','Archives','Design','Education','Campus','Technology']);const html=await (await call('/research-papers?q='+marker)).text();assert.ok(!html.includes('Keywords: ['));});
 await check('Retired input fields are rejected',async()=>{for(const extra of [{institution:'x'},{adviser:'x'},{publication_url:'https://example.org'},{sections:{Methodology:'x',Results:'x',Conclusion:'x'}}]){const r=await call(`/api/papers/${id}`,{method:'PUT',cookie:admin,body:{...body,...extra}});assert.equal(r.status,400);}});
 await check('Admin edits paper; authors and status persist',async()=>{const r=await call(`/api/papers/${id}`,{method:'PUT',cookie:admin,body:{...body,title:body.title+' edited',keywords:[' Local QA ','local qa','Archives']}});assert.equal(r.status,200);const row=await (await call(`/api/papers/${id}`,{cookie:admin})).json();assert.equal(row.authors.length,2);assert.match(row.title,/edited$/);assert.deepEqual(row.keywords,['Local QA','Archives']);assert.equal(row.full_text,'PRIVATE_FULL_TEXT_SENTINEL');});
 const pdf=new Blob(['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF'],{type:'application/pdf'}),form=new FormData();form.set('file',pdf,'demo-only.pdf');
 await check('Admin uploads PDF and can download exact bytes',async()=>{const r=await call(`/api/papers/${id}/upload`,{method:'POST',cookie:admin,body:form});assert.equal(r.status,200);const d=await call(`/api/papers/${id}/download`,{cookie:admin});assert.equal(d.status,200);assert.equal(await d.text(),await pdf.text());});
 for(const [label,cookie] of [['public user',publicCookie]]){
 await check(`${label}: list and detail contain no private data`,async()=>{const list=await (await call(`/api/papers?admin=1&q=${marker}`,{cookie})).json();assert.equal(list.papers.length,1);restricted(list.papers[0],!!cookie);const r=await call(`/api/papers/${id}?admin=1`,{cookie});assert.equal(r.status,200);restricted(await r.json(),!!cookie);});
 await check(`${label}: full text and PDF return 403`,async()=>{for(const url of [`/api/papers/${id}/sections`,`/api/papers/${id}/download`])assert.equal((await call(url,{cookie})).status,403);});
 await check(`${label}: add/edit/delete/upload denied`,async()=>{for(const [method,url,b] of [['POST','/api/papers',body],['PUT',`/api/papers/${id}`,body],['DELETE',`/api/papers/${id}`,undefined],['POST',`/api/papers/${id}/upload`,form]])assert.equal((await call(url,{method,cookie,body:b})).status,403);});
 await check(`${label}: abstract/citation follow login gate; detail HTML excludes full-text controls`,async()=>{assert.equal((await call(`/api/research-papers/${slug}/abstract`,{cookie})).status,cookie?200:401);const html=await (await call(`/research-papers/${slug}`,{cookie})).text();assert.equal(html.includes('Public verification abstract'),!!cookie);assert.doesNotMatch(html,/PRIVATE_FULL_TEXT_SENTINEL|View full paper|Download full paper PDF/);});
 }
 await check('Guest API access denied',async()=>{assert.equal((await call('/api/papers',{cookie:''})).status,401);});
 await check('Direct file paths are inaccessible',async()=>{const key=sqlite.prepare('SELECT file_key FROM research_papers WHERE id=?').get(id).file_key;for(const prefix of ['/data/uploads/','/uploads/','/public/'])assert.equal((await call(prefix+key)).status,404);});
 await check('Admin full-text endpoint works; retired response fields absent',async()=>{const r=await call(`/api/papers/${id}/sections`,{cookie:admin});assert.equal(r.status,200);assert.equal((await r.json()).full_text,'PRIVATE_FULL_TEXT_SENTINEL');const p=await (await call(`/api/papers/${id}`,{cookie:admin})).json();for(const k of ['institution','adviser','publication_url','doi','sections'])assert.equal(Object.hasOwn(p,k),false);});
 await check('Merged program and both legacy filters find the paper',async()=>{for(const slug of ['bs-nursing-midwifery','bs-nursing','diploma-midwifery']){const r=await (await call(`/api/papers?program=${slug}&q=${marker}`)).json();assert.equal(r.papers.length,1);assert.equal(r.papers[0].program_id,'bs-nursing-midwifery');}});
 await check('Active schema omits removed fields',async()=>{const cols=sqlite.prepare('PRAGMA table_info(research_papers)').all().map(c=>c.name);for(const c of ['institution','adviser','publication_url','doi','sections','Methodology','Results','Conclusion'])assert.equal(cols.includes(c),false);});
 await check('Citation formats handle 0/1/2/3/7/21 authors without private fields',async()=>{for(const count of [0,1,2,3,7,21]){const record={title:'A Study of Local Archives',year:2026,program:program.name,authors:Array.from({length:count},(_,i)=>({name:`Given${i} Family${i}`,given_name:`Given${i}`,family_name:`Family${i}`,suffix:null}))};for(const [style] of citationStyles){const text=citation(record,style);assert.match(text,/A Study of Local Archives/);assert.match(text,/2026/);assert.match(text,/SLSU Gumaca Research Archive/);assert.doesNotMatch(text,/https?:|file_url|PRIVATE_/);if(['apa','harvard','chicago','mla','ieee'].includes(style))assert.ok(citationParts(record,style).some(p=>p.italic));}if(count===2)assert.match(citation(record,'apa'),/, & /);if(count===3)assert.match(citation(record,'mla'),/et al\./);if(count===7)assert.match(citation(record,'ieee'),/et al\./);if(count===21)assert.match(citation(record,'apa'),/…/);}});
 await check('Blocked clipboard fallback copies text or offers manual selection',async()=>{
 for(const succeeds of [true,false]){let copiedText='',removed=false,restored=false,selected=false,field;
 const platform={navigator:{clipboard:{writeText:async()=>{throw new Error('Permission denied');}}},document:{activeElement:{focus:()=>{restored=true;}},createElement:()=>{field={value:'',style:{},select:()=>{selected=true;},remove:()=>{removed=true;}};return field;},execCommand:()=>{copiedText=field.value;return succeeds;}}};
 const container={appendChild:()=>{}};const result=await copyCitation('Citation fallback text',null,container,platform);assert.equal(result,succeeds);assert.equal(copiedText,'Citation fallback text');assert.ok(selected&&removed&&restored);
 }
 });
 await check('Migration preserves legacy papers, links, files and Introduction',async()=>{
 mkdirSync('verification',{recursive:true});const filename=path.resolve('verification',`migration-fixture-${marker}.sqlite`),db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON;CREATE TABLE local_migrations(name TEXT PRIMARY KEY)');for(const name of ['0000_blue_galactus.sql','0001_pretty_doomsday.sql','0002_curly_the_enforcers.sql'])db.exec(readFileSync('drizzle/'+name,'utf8'));
 db.exec("INSERT INTO programs(slug,name) VALUES ('bs-nursing','Nursing'),('diploma-midwifery','Midwifery'); INSERT INTO authors(name) VALUES ('Legacy Author')");
 for(const p of db.prepare('SELECT id FROM programs').all()){db.prepare('INSERT INTO research_papers(slug,title,year,program_id,sections,file_key,status,institution,adviser,publication_url) VALUES (?,?,?,?,?,?,?,?,?,?)').run('legacy-'+p.id,'Legacy '+p.id,2024,p.id,JSON.stringify({Introduction:'preserved intro',Methodology:'retired',Results:'retired',Conclusion:'retired'}),'papers/legacy.pdf','verified','retired','retired','https://example.org');db.prepare('INSERT INTO research_paper_authors VALUES (?,1,0)').run(p.id);}
 migrateArchive(db,filename);migrateArchive(db,filename);assert.equal(db.prepare('SELECT COUNT(*) n FROM research_papers').get().n,2);assert.equal(db.prepare('SELECT COUNT(*) n FROM research_paper_authors').get().n,2);assert.equal(db.prepare('SELECT COUNT(DISTINCT program_id) n FROM research_papers').get().n,1);for(const p of db.prepare('SELECT * FROM research_papers').all()){assert.equal(p.full_text,'preserved intro');assert.equal(p.file_key,'papers/legacy.pdf');assert.equal(Object.hasOwn(p,'institution'),false);}assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);db.close();
 });
 await check('Admin deletes paper and links cleanly',async()=>{const r=await call(`/api/papers/${id}`,{method:'DELETE',cookie:admin});assert.equal(r.status,200);assert.equal((await call(`/api/papers/${id}`,{cookie:admin})).status,404);assert.equal(sqlite.prepare('SELECT count(*) n FROM research_paper_authors WHERE paper_id=?').get(id).n,0);created=[];});
}finally{
 for(const id of created){sqlite.prepare('DELETE FROM bookmarks WHERE paper_id=?').run(id);sqlite.prepare('DELETE FROM research_paper_authors WHERE paper_id=?').run(id);sqlite.prepare('DELETE FROM research_papers WHERE id=?').run(id);}
 sqlite.prepare('DELETE FROM sessions WHERE user_id IN (?,?)').run(adminId,publicId);sqlite.prepare('DELETE FROM users WHERE id IN (?,?)').run(adminId,publicId);
}

