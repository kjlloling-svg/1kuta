// Local-only fixture server. Never load production credentials or expose this on a public host.
import {randomBytes} from 'node:crypto';
if(process.env.VERCEL||process.env.TURSO_DATABASE_URL)throw Error('Local verification only');
process.env.DATABASE_PATH='data/import-verification.sqlite';
process.env.SESSION_SECRET=randomBytes(48).toString('hex');
const {sqlite}=await import('./local-database.mjs');
const {programs}=await import('../lib/programs.ts');
for(const p of programs)sqlite.prepare('INSERT OR IGNORE INTO programs(slug,name,major,description) VALUES(?,?,?,?)').run(p.slug,p.name,p.major,'Local test program');
for(const role of ['admin','public'])sqlite.prepare("INSERT OR IGNORE INTO users(id,email,name,role,password_hash,password_salt,google_sub,created_at) VALUES(?,?,?,?,?,?,?,?)").run('import-test-'+role,`import-test-${role}@example.test`,'Import Test '+role,role,'','','import-test-'+role,Math.floor(Date.now()/1000));
const {newSession,SESSION_COOKIE}=await import('../lib/google-session.mjs');
const sessions=Object.fromEntries(await Promise.all(['admin','public'].map(async role=>[role,await newSession('import-test-'+role)])));
const {default:next}=await import('next');const {default:express}=await import('express');
const app=next({dev:true,hostname:'localhost',port:3018});await app.prepare();
const server=express(),key=randomBytes(16).toString('hex');
server.get(`/__test/${key}/:role`,(req,res)=>{if(!sessions[req.params.role])return res.sendStatus(404);res.cookie(SESSION_COOKIE,sessions[req.params.role],{httpOnly:true,sameSite:'lax'});res.redirect('/admin');});
server.use((req,res)=>{req.headers['x-kuta-client-ip']=req.socket.remoteAddress||'test';return app.getRequestHandler()(req,res);});
server.listen(3018,'localhost',()=>console.log(`Local test sign-in: http://localhost:3018/__test/${key}/admin`));
