import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import vm from 'node:vm';
import fs from 'node:fs';
import {newSession,SESSION_COOKIE} from '../lib/google-session.mjs';
import {sqlite} from './local-database.mjs';
import {themeBootstrapScript} from '../lib/theme.mjs';
import {toPaperDTO,toPublicPaperDTO,toCitationDTO} from '../lib/archive-dto.ts';
import {citationStyles} from '../lib/citations.ts';
const base=('http://localhost:'+(process.env.PORT||3000)),marker=randomUUID(),password=randomBytes(18).toString('hex'),abstract='ABSTRACT_ONLY_'+marker,privateText='PRIVATE_FULL_'+marker,slug='access-'+marker;
const users=[],lines=[];let id;
const request=(path,cookie='',headers={})=>fetch(base+path,{headers:{...(cookie?{Cookie:cookie}:{}),...headers},redirect:'manual'});
async function check(name,run){await run();lines.push('PASS: '+name);console.log(lines.at(-1));}
function cache(response){assert.match(response.headers.get('cache-control'),/no-store/);assert.match(response.headers.get('vary')||'',/cookie/i);}
function themeFixture({cookie='',stored=null,systemDark=false,blocked=false}={}){
 const events={},frames=[],control={checked:false},root={dataset:{theme:'light'},classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){}};let reloads=0;
 const document={documentElement:root,cookie,querySelectorAll:()=>[control]},storage={getItem:()=>{if(blocked)throw Error('blocked');return stored;},setItem:(_key,value)=>{if(blocked)throw Error('blocked');stored=value;}},media={matches:systemDark,addEventListener:(name,fn)=>events['media-'+name]=fn};
 const window={addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:event=>events[event.type]?.(event)};
 vm.runInNewContext(themeBootstrapScript,{document,localStorage:storage,window,location:{protocol:'http:',reload:()=>reloads++},matchMedia:()=>media,MutationObserver:class{observe(){}},Event:class{constructor(type){this.type=type;}},requestAnimationFrame:fn=>frames.push(fn)});
 return {root,document,control,events,frames,get reloads(){return reloads;}};
}
try{
 await check('Pre-paint theme: cookie, legacy storage, system dark and unavailable storage',()=>{for(const [options,expected] of [[{cookie:'kuta-theme=dark',stored:'light'},'dark'],[{stored:'dark'},'dark'],[{systemDark:true},'dark'],[{systemDark:true,blocked:true},'dark'],[{},'light']]){const result=themeFixture(options);assert.equal(result.root.dataset.theme,expected);assert.equal(result.control.checked,expected==='dark');assert.equal(result.frames.length,1);}const legacy=themeFixture({stored:'dark'});assert.match(legacy.document.cookie,/kuta-theme=dark/);const cached=themeFixture({cookie:'kuta-theme=dark'});cached.events.pageshow({persisted:true});assert.equal(cached.reloads,1);});
 await check('Guest mapper is fail-closed and never serializes abstract/file names',()=>{const raw={id:1,year:2026,slug,title:'Metadata',abstract,full_text:privateText,file_name:'PRIVATE.pdf'};for(const access of ['guest',undefined,false,'invalid']){const dto=toPaperDTO(raw,access);assert.ok(!Object.hasOwn(dto,'abstract'));assert.ok(!Object.hasOwn(dto,'file_name'));assert.ok(!JSON.stringify(toPublicPaperDTO(dto,[],[],access)).includes(abstract));assert.throws(()=>toCitationDTO(dto,[],access));}});
 const program=sqlite.prepare('SELECT id FROM programs LIMIT 1').get();
 id=Number(sqlite.prepare('INSERT INTO research_papers(slug,title,year,program_id,abstract,keywords,status,full_text) VALUES(?,?,?,?,?,?,?,?)').run(slug,'DEMO access verification '+marker,2026,program.id,abstract,'["access check"]','demo',privateText).lastInsertRowid);
 const cookies={};for(const role of ['public','admin']){const user=randomUUID();users.push(user);sqlite.prepare('INSERT INTO users(id,email,name,role,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?,?)').run(user,role+'-'+marker+'@kuta.local','Access verifier',role,'','',Math.floor(Date.now()/1000));sqlite.prepare('UPDATE users SET google_sub=? WHERE id=?').run(user,user);cookies[role]=SESSION_COOKIE+'='+await newSession(user);}
 for(const role of ['guest','public','admin']){
  const session=cookies[role]||'';
  await check(role+': list/detail metadata and no-store session separation',async()=>{for(const path of ['/api/papers?q='+marker+'&admin=1','/api/papers/'+id+'?admin=1']){const response=await request(path,session);assert.equal(response.status,200);cache(response);const payload=await response.json(),paper=payload.papers?payload.papers[0]:payload;assert.equal(Object.hasOwn(paper,'abstract'),role!=='guest');if(role!=='guest')assert.equal(paper.abstract,abstract);if(role!=='admin')for(const key of ['file_key','file_name','file_url','full_text','has_file'])assert.ok(!Object.hasOwn(paper,key));}});
  await check(role+': detail HTML/RSC payload and metadata obey access rules',async()=>{for(const headers of [{},{RSC:'1'}]){const response=await request('/research-papers/'+slug+(headers.RSC?'?_rsc':''),session,headers);assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);const text=await response.text();assert.equal(text.includes(abstract),role!=='guest');assert.ok(!text.includes(privateText));if(role==='guest'){if(!headers.RSC)assert.match(text,/Sign in with Google to view the full abstract and citations/);assert.ok(!text.includes('Cite ▾'));}if(!headers.RSC)assert.equal(text.includes('View full paper'),role==='admin');}});
  await check(role+': abstract endpoint and all eight citation formats',async()=>{const a=await request('/api/research-papers/'+slug+'/abstract',session);cache(a);assert.equal(a.status,role==='guest'?403:200);for(const [style] of citationStyles){const response=await request('/api/papers/'+id+'/citation?style='+style,session);cache(response);assert.equal(response.status,role==='guest'?403:200);const output=await response.text();assert.ok(!output.includes(abstract)&&!output.includes(privateText));if(role!=='guest')assert.ok(JSON.parse(output).text.includes('DEMO access verification'));}});
 }
 await check('Guest search cannot search private abstracts',async()=>{const r=await request('/api/papers?q='+encodeURIComponent(abstract));assert.equal(r.status,200);assert.equal((await r.json()).total,0);});
 await check('Guest home/archive responses contain no protected text',async()=>{for(const path of ['/','/research-papers']){const response=await request(path);assert.ok(!(await response.text()).includes(abstract));}});
 await check('Dark cookie is in server HTML and blocking head script precedes body',async()=>{const html=await(await request('/',cookies.admin+'; kuta-theme=dark')).text();assert.match(html,/<html[^>]*data-theme="dark"/);const script=html.indexOf('kuta-set-theme');assert.ok(script>0&&script<html.indexOf('<body'));assert.match(html,/name="color-scheme" content="light dark"/);assert.match(html,/<input[^>]*data-theme-control[^>]*checked=""/);});
 await check('Expired/revoked sessions cannot read abstract or cite',async()=>{sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(users[0]);assert.equal((await request('/api/papers/'+id+'/citation',cookies.public)).status,403);assert.equal((await request('/api/research-papers/'+slug+'/abstract',cookies.public)).status,403);const response=await request('/api/papers/'+id,cookies.public);assert.equal(response.status,200);assert.ok(!Object.hasOwn(await response.json(),'abstract'));});
 await check('Researcher credit is correct on About and footer',async()=>{for(const path of ['/about','/']){const html=await(await request(path,cookies.admin)).text();assert.ok(html.includes('Kurt John Lenoel Loling'));assert.ok(!html.includes('Kurt John Lenol Loling'));}});
}finally{
 if(id){sqlite.prepare('DELETE FROM research_paper_authors WHERE paper_id=?').run(id);sqlite.prepare('DELETE FROM research_papers WHERE id=?').run(id);}for(const user of users){sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(user);sqlite.prepare('DELETE FROM users WHERE id=?').run(user);}fs.writeFileSync('verification/THEME-ACCESS-TESTS.txt',lines.join('\n')+'\n');
}
