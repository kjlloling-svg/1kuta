import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {currentResearchYear,csvDocument,IMPORT_COLUMNS} from '../lib/record-validation.ts';
const login=new URL(process.argv[2]);
assert.equal(login.origin,'http://localhost:3018','Use the isolated test-import-server only');
const base=login.origin;
async function cookie(url){const r=await fetch(url,{redirect:'manual'});assert.equal(r.status,302);return r.headers.get('set-cookie').split(';')[0];}
const admin=await cookie(login),publicCookie=await cookie(login.href.replace(/admin$/,'public'));
async function call(path,body,auth=admin,origin=base,method='POST'){return fetch(base+path,{method,headers:{Origin:origin,Cookie:auth,'Content-Type':'application/json'},body:JSON.stringify(body)});}
const programs=(await (await fetch(base+'/api/programs')).json()).programs,p=programs[0],prefix=randomUUID();
const single={title:'HTTP '+prefix,authors:[{given:'Ana',family:'Reyes'}],program_id:p.id,year:currentResearchYear(),keywords:[],status:'pending'};
for(const auth of ['',publicCookie]){assert([401,403].includes((await call('/api/papers',single,auth)).status));assert([401,403].includes((await call('/api/admin/import',{action:'preview',rows:[]},auth)).status));}
assert.equal((await call('/api/admin/import',{action:'preview',rows:[]},admin,'https://other.invalid')).status,403);
for(const patch of [{year:2008},{year:currentResearchYear()+1},{status:'demo'},{category:'Thesis'},{department:'old'},{program_id:999999}])assert.equal((await call('/api/papers',{...single,...patch})).status,400,JSON.stringify(patch));
const added=await call('/api/papers',single);assert.equal(added.status,201);const id=(await added.json()).id;
assert.equal((await call('/api/papers',single)).status,409);
assert.equal((await call('/api/papers/'+id,{...single,abstract:'Updated safely'},admin,base,'PUT')).status,200);
const values={title:'Batch '+prefix,authors:'Ana | Reyes',program:p.slug,year:String(currentResearchYear()),abstract:'Test abstract',keywords:'education',status:'pending'};
const rows=[{row:2,values},{row:3,values:{...values}},{row:4,values:{...values,title:'Bad year',year:'2008'}},{row:5,values:{...values,title:'=HYPERLINK("bad")'}},{row:6,values:{...values,title:'Bad program',program:'invalid'}},{row:7,values:{...values,title:'HTTP '+prefix}}];
const preview=await call('/api/admin/import',{action:'preview',rows});assert.equal(preview.status,200);assert.deepEqual((await preview.json()).results.map(r=>r.outcome),['valid','skipped','skipped','skipped','skipped','skipped']);
const imported=await call('/api/admin/import',{action:'import',rows});assert.equal(imported.status,200);assert.deepEqual((await imported.json()).results.map(r=>r.outcome),['added','skipped','skipped','skipped','skipped','skipped']);
const retry=await call('/api/admin/import',{action:'import',rows});assert((await retry.json()).results.every(r=>r.outcome==='skipped'));
assert.equal((await call('/api/admin/import',{action:'preview',rows:Array(21).fill(rows[0])})).status,400);
assert.equal((await call('/api/admin/import',{action:'preview',rows:[{row:502,values}]})).status,400);
assert.equal((await call('/api/admin/import',{action:'preview',rows:[{row:2,values:{...values,abstract:'x'.repeat(2_000_001)}}]})).status,400);
const large=Array.from({length:500},(_,i)=>({row:i+2,values:{...values,title:`Large batch ${prefix} ${i}`}}));
let total=0;
for(let i=0;i<large.length;i+=20){const response=await call('/api/admin/import',{action:'import',rows:large.slice(i,i+20)});assert.equal(response.status,200);total+=(await response.json()).results.filter(r=>r.outcome==='added').length;}
assert.equal(total,500);
// Synthetic browser fixtures never contain production data.
writeFileSync('data/import-browser.csv',csvDocument([IMPORT_COLUMNS,...[
 {...values,title:'Browser batch '+prefix},
 {...values,title:'Browser batch '+prefix},
 {...values,title:'Browser invalid year',year:'2008'},
 {...values,title:'HTTP '+prefix},
 {...values,title:'Browser second '+prefix,status:'verified'},
].map(v=>IMPORT_COLUMNS.map(c=>v[c]))]));
console.log('PASS: HTTP admin/public/guest permissions, origin check, server validation, add/edit, duplicate conflict, mixed import, safe retries, chunk/body bounds. Browser fixture ready.');
