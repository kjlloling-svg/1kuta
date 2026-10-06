import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import fs from 'node:fs';import net from 'node:net';import {setTimeout as delay} from 'node:timers/promises';import {createRequire} from 'node:module';
process.env.TURSO_DATABASE_URL='';process.env.TURSO_AUTH_TOKEN='';process.env.VERCEL='';process.env.BLOB_READ_WRITE_TOKEN='';
process.env.DATABASE_PATH='data/favorites-test-'+randomUUID()+'.sqlite';process.env.SESSION_SECRET=randomBytes(48).toString('hex');process.env.GOOGLE_CLIENT_ID='test-client';
const {sqlite,localDatabase}=await import('./local-database.mjs');const {migrateFavorites}=await import('./migrate-favorites.mjs');await migrateFavorites(localDatabase);
const {newSession,SESSION_COOKIE,digest}=await import('../lib/google-session.mjs');
const users={};for(const role of ['admin','public','other']){const id=randomUUID();sqlite.prepare("INSERT INTO users(id,email,name,google_sub,password_hash,password_salt,role,created_at) VALUES(?,?,?,?,?,?,?,0)").run(id,role+'@example.com',role+' Reader',id,'','',role==='admin'?'admin':'public');users[role]={id,token:await newSession(id)};}
const {programs:catalog}=await import('../lib/programs.ts');for(const p of catalog)sqlite.prepare('INSERT OR IGNORE INTO programs(slug,name,major) VALUES(?,?,?)').run(p.slug,p.name,p.major);
const programs=sqlite.prepare('SELECT * FROM programs ORDER BY id').all();const nursing=programs.find(p=>p.slug==='bs-nursing-midwifery'),math=programs.find(p=>p.slug==='bsed-mathematics');
const author=Number(sqlite.prepare("INSERT INTO authors(name,given_name,family_name) VALUES('Maria Santos','Maria','Santos')").run().lastInsertRowid);
const insert=(slug,title,status,program=nursing.id,year=2025)=>{const id=Number(sqlite.prepare('INSERT INTO research_papers(slug,title,status,program_id,year,keywords,created_at) VALUES(?,?,?,?,?,?,?)').run(slug,title,status,program,year,'["diabetes","100%_literal"]',new Date().toISOString()).lastInsertRowid);sqlite.prepare('INSERT INTO research_paper_authors(paper_id,author_id,position) VALUES(?,?,0)').run(id,author);return id;};
const pending=insert('pending-diabetes','Diabetes Review','pending'),verified=insert('verified-health','Verified Health Study','verified'),demo=insert('demo-only','Demo Only','demo'),second=insert('verified-math','Mathematics Study','verified',math.id,2024);
for(let i=0;i<23;i++)insert('queue-'+i,'Queue '+i,'pending',math.id,2024);
sqlite.exec('PRAGMA foreign_keys=OFF');const orphan=insert('uncategorized','Uncategorized fixture','pending',99999);sqlite.exec('PRAGMA foreign_keys=ON');
const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));const base='http://localhost:'+port;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env:{...process.env,NODE_ENV:'production'},windowsHide:true,stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const request=(path,role='',method='GET',body)=>fetch(base+path,{method,redirect:'manual',headers:{origin:base,...(role?{cookie:SESSION_COOKIE+'='+users[role].token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
const data=async(path,role='admin')=>{const r=await request(path,role);assert.equal(r.status,200,path);return r.json();};
const output='verification/dashboard-bookmarks';fs.mkdirSync(output,{recursive:true});let browsers=[];
try{
 let ready=false;for(let i=0;i<120;i++){try{if((await request('/login')).status===200){ready=true;break;}}catch{}await delay(250);}assert.ok(ready,'Test server did not start');
 for(const role of ['','public'])assert.equal((await request('/api/admin/records',role)).status,role?403:401);
 let r=await data('/api/admin/records');assert.equal(r.total,25);assert.equal(r.papers.length,20);assert.equal(r.statuses.all,28);assert.equal(r.statuses.verified,2);
 for(const q of [' DIABETES REVIEW ','sAnToS','100%_literal','Nursing','2025'])assert.ok((await data('/api/admin/records?q='+encodeURIComponent(q))).total>0,q);
 assert.equal((await data('/api/admin/records?q='+encodeURIComponent("' OR 1=1 --"))).total,0);
 assert.equal((await data('/api/admin/records?q=diabetes&program=bs-nursing-midwifery&status=pending')).total,1);
 assert.equal((await data('/api/admin/records?program=uncategorized')).papers[0].id,orphan);
 assert.equal((await data('/api/admin/records?page=2')).papers.length,5);
 const body={title:'Diabetes reviewed',authors:[{given:'Maria',family:'Santos'}],program_id:nursing.id,year:2025,category:'Research Paper',keywords:['diabetes'],status:'verified',abstract:'Private test abstract'};
 assert.equal((await request('/api/papers/'+pending,'public','PUT',body)).status,403);
 assert.equal((await request('/api/papers/'+pending,'admin','PUT',body)).status,200);
 assert.equal((await data('/api/admin/records')).statuses.verified,3);
 assert.equal((await request('/api/papers/'+pending,'admin','PUT',{...body,status:'pending'})).status,200);
 assert.equal((await request('/api/papers/'+demo,'admin','DELETE')).status,200);
 for(const role of ['','admin'])for(const route of ['/api/bookmarks','/api/favorites'])assert.equal((await request(route,role)).status,role?403:401);
 assert.equal((await request('/api/bookmarks','public','POST',{paper_id:pending})).status,404);
 assert.equal((await request('/api/bookmarks','public','POST',{paper_id:verified,user_id:users.other.id})).status,400);
 assert.equal((await request('/api/bookmarks','public','POST',{paper_id:verified})).status,200);
 assert.equal((await request('/api/bookmarks','public','POST',{paper_id:verified})).status,200);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM bookmarks').get().n,1);
 assert.equal((await data('/api/favorites','other')).total,0);
 assert.equal((await request('/api/bookmarks','other','DELETE',{paper_id:verified})).status,200);
 assert.equal((await data('/api/favorites','public')).total,1);
 await delay(10);await request('/api/bookmarks','public','POST',{paper_id:second});assert.equal((await data('/api/favorites','public')).papers[0].id,second);
 sqlite.prepare("UPDATE research_papers SET status='pending' WHERE id=?").run(verified);assert.equal((await data('/api/favorites','public')).total,1);assert.ok(!(await data('/api/bookmarks','public')).bookmarks.includes('verified-health'));
 sqlite.prepare("UPDATE research_papers SET status='verified' WHERE id=?").run(verified);
 await request('/api/papers/'+second,'admin','DELETE');assert.equal((await data('/api/favorites','public')).total,1);
 assert.equal((await request('/api/research-papers/verified-health/abstract')).status,403);assert.equal((await request('/api/papers/'+verified+'/citation')).status,403);
 sqlite.prepare('INSERT OR REPLACE INTO login_attempts(key,count,window_start) VALUES(?,30,?)').run(digest('favorites:write:'+users.other.id),Math.floor(Date.now()/1000));assert.equal((await request('/api/bookmarks','other','POST',{paper_id:verified})).status,429);
 assert.equal((await request('/api/auth/logout','public','POST')).status,303);assert.equal((await request('/api/favorites','public')).status,401);users.public.token=await newSession(users.public.id);assert.equal((await data('/api/favorites','public')).total,1);
 console.log('PASS: admin search, counts, composition, pagination, uncategorized, mutations and role checks; favorites ownership, uniqueness, verified-only, deletion, expiry/logout, rate limits and re-login persistence');
 if(process.argv.includes('--browser')){
  const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const matrix=[];
  for(const browserName of ['Chrome','Brave']){
   const browser=await chromium.launch(browserName==='Chrome'?{channel:'chrome',headless:true}:{executablePath:process.cwd()+'/node_modules/.design-brave/browser/brave.exe',headless:true});browsers.push(browser);
   for(const width of [375,768,1920])for(const theme of ['light','dark']){
    for(const role of ['admin','public']){
     const c=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});await c.addCookies([{name:SESSION_COOKIE,value:users[role].token,url:base}]);const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
     const path=role==='admin'?'/admin?status=pending&program=bs-nursing-midwifery&q=diabetes':'/profile';await p.goto(base+path,{waitUntil:'domcontentloaded'});
     if(role==='admin'){await p.getByText('1 matching records',{exact:true}).waitFor();await p.reload({waitUntil:'domcontentloaded'});await p.getByText('1 matching records',{exact:true}).waitFor();assert.equal(await p.locator('#review-search').inputValue(),'diabetes');assert.equal(await p.getByRole('button',{name:'Add to favorites',exact:true}).count(),0);}
     else{await p.getByRole('button',{name:'Remove from favorites',exact:true}).waitFor();}
     assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${browserName} ${width} ${theme} ${role} overflow`);assert.equal(await p.locator('html').getAttribute('data-theme'),theme);assert.deepEqual(errors,[]);
     await p.screenshot({path:`${output}/${browserName}-${width}-${theme}-${role}.png`,fullPage:true});matrix.push({browserName,width,theme,role,passed:true});fs.writeFileSync(output+'/browser-matrix.json',JSON.stringify(matrix,null,2));await c.close();
    }
   }
   const c=await browser.newContext({viewport:{width:375,height:900}});const p=await c.newPage();await p.goto(base,{waitUntil:'domcontentloaded'});assert.equal(await p.locator('main .year-home-link').count(),0);assert.ok(await p.getByRole('link',{name:'Browse by Year',exact:true}).count()>0);await p.getByRole('button',{name:'Add to favorites',exact:true}).first().click();await p.getByRole('heading',{name:'Sign in to save favorites'}).waitFor();assert.equal(new URL(p.url()).pathname,'/');await p.getByRole('button',{name:'Close sign-in',exact:true}).click();await c.close();
   const pub=await browser.newContext();await pub.addCookies([{name:SESSION_COOKIE,value:users.public.token,url:base}]);const page=await pub.newPage();await page.goto(base+'/profile',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Remove from favorites',exact:true}).click();await page.getByText("You haven't saved any papers yet.").waitFor();await page.goto(base+'/research-papers/verified-health',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Add to favorites',exact:true}).click();await page.getByRole('button',{name:'Remove from favorites',exact:true}).waitFor();await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Remove from favorites',exact:true}).waitFor();
   await page.route('**/api/bookmarks',route=>route.request().method()==='DELETE'?route.fulfill({status:503,contentType:'application/json',body:'{"error":"Test failure"}'}):route.continue());await page.getByRole('button',{name:'Remove from favorites',exact:true}).click();await page.getByText('Test failure',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Remove from favorites',exact:true}).getAttribute('aria-pressed'),'true');await pub.close();await browser.close();browsers=browsers.filter(b=>b!==browser);console.log('PASS: '+browserName+' matrix, guest dialog, profile removal, detail state persistence and optimistic rollback');
  }
  fs.writeFileSync(output+'/browser-matrix.json',JSON.stringify(matrix,null,2));
 }
 fs.writeFileSync(output+'/security-checks.json',JSON.stringify({passed:true,disposableDatabase:true,productionDataModified:false},null,2));
}finally{for(const b of browsers)await b.close();server.kill();await new Promise(r=>server.once('exit',r));sqlite.close();for(const suffix of ['','-wal','-shm'])try{fs.unlinkSync(process.env.DATABASE_PATH+suffix);}catch{}}


