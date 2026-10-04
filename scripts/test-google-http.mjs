import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import {unlinkSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import net from 'node:net';
// This runner uses a disposable database and synthetic session fixtures, never live credentials.
process.env.TURSO_DATABASE_URL='';process.env.TURSO_AUTH_TOKEN='';process.env.VERCEL='';process.env.BLOB_READ_WRITE_TOKEN='';
process.env.DATABASE_PATH='data/google-http-test-'+randomUUID()+'.sqlite';process.env.SESSION_SECRET=randomBytes(48).toString('hex');process.env.GOOGLE_CLIENT_ID='test-client';
const {sqlite}=await import('./local-database.mjs');
const {newSession,SESSION_COOKIE}=await import('../lib/google-session.mjs');
const listener=net.createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
const base='http://localhost:'+port;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env:{...process.env,NODE_ENV:'production'},windowsHide:true,stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const request=(url,cookie='',extra={})=>fetch(base+url,{redirect:'manual',headers:{...(cookie?{cookie}:{}),...extra.headers},...extra});
try{
 let ready=false;for(let i=0;i<120;i++){try{if((await request('/login')).status===200){ready=true;break;}}catch{}await delay(250);}assert.ok(ready,'Production server did not start: '+logs);
 for(const route of ['/','/about','/faq','/programs','/research-papers','/research-papers/test']){const r=await request(route);assert.equal(r.status,200,route);assert.equal(r.headers.get('location'),null);assert.match(r.headers.get('cache-control'),/no-store/);}
 assert.equal((await request('/admin')).status,307);
 for(const route of ['/api/papers','/api/programs','/api/keywords','/api/stats'])assert.equal((await request(route)).status,200,route);
 for(const route of ['/api/papers/1/citation','/api/research-papers/test/abstract']){const r=await request(route);assert.equal(r.status,403);assert.deepEqual(await r.json(),{error:'Login required',type:'auth_required'});}
 for(const route of ['/api/bookmarks','/api/papers/1/download','/api/papers/1/sections','/api/auth/login','/api/auth/register','/api/auth/password-reset','/api/admin/setup'])assert.equal((await request(route)).status,401,route);
 for(const route of ['/login','/register']){const r=await request(route);assert.equal(r.status,200);const html=await r.text();assert.ok(!html.includes('type="password"'));assert.ok(!html.includes('Forgot password?'));}
 assert.equal((await request('/favicon.svg')).status,200);
 const id=randomUUID();sqlite.prepare("INSERT INTO users(id,email,name,google_sub,password_hash,password_salt,role,created_at) VALUES(?,?,'Test Reader',?,'','','public',0)").run(id,'reader@example.com',id);
 let cookie=SESSION_COOKIE+'='+await newSession(id);
 assert.equal((await request('/api/auth/me',cookie)).status,200);
 for(const route of ['/','/about','/programs','/research-papers'])assert.equal((await request(route,cookie)).status,200,route);
 assert.match(await(await request('/admin',cookie)).text(),/Administrator access required/);
 assert.equal((await request('/api/papers/1/download',cookie)).status,403);
 for(const route of ['/api/auth/login','/api/auth/register','/api/auth/password-reset','/api/admin/setup'])assert.equal((await request(route,cookie,{method:'POST',headers:{cookie,origin:base}})).status,404,route);
 sqlite.prepare("UPDATE users SET role='admin' WHERE id=?").run(id);assert.match(await(await request('/admin',cookie)).text(),/Research dashboard/);
 const logout=await request('/api/auth/logout',cookie,{method:'POST',headers:{cookie,origin:base}});assert.equal(logout.status,303);assert.equal((await request('/api/auth/me',cookie)).status,401);
 cookie=SESSION_COOKIE+'='+await newSession(id);sqlite.prepare('UPDATE sessions SET expires_at=0').run();assert.equal((await request('/',cookie)).status,200);assert.equal((await request('/api/papers/1/citation',cookie)).status,403);assert.match((await request('/admin',cookie)).headers.get('location'),/session_expired/);
 if(process.argv.includes('--regressions'))for(const script of ['test-archive.mjs','test-ui.mjs','test-theme-access.mjs','test-layout.mjs']){
  const child=spawn(process.execPath,['--experimental-strip-types','scripts/'+script],{env:{...process.env,PORT:String(port)},windowsHide:true,stdio:'inherit'});
  const code=await new Promise(resolve=>child.once('exit',resolve));assert.equal(code,0,script);
 }
 const {digest}=await import('../lib/google-session.mjs');
 sqlite.prepare('UPDATE login_attempts SET count=120,window_start=? WHERE key=?').run(Math.floor(Date.now()/1000),digest('public-browse:local'));
 const throttled=await request('/api/papers');assert.equal(throttled.status,429);assert.equal(throttled.headers.get('retry-after'),'60');
 assert.ok(logs.includes('restricted_content_denied')&&logs.includes('auth_required')&&logs.includes('rate_limited'));
 console.log('PASS: built production server; public browsing, restricted abstract/citation 403 responses, private administrator access, anonymous rate limiting and audit logging, Google-only forms, static assets, authenticated pages, roles, removed routes, logout and expiry');
}finally{server.kill();await new Promise(resolve=>server.once('exit',resolve));sqlite.close();for(const suffix of ['','-wal','-shm'])try{unlinkSync(process.env.DATABASE_PATH+suffix);}catch{}}
