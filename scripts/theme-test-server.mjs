// Isolated presentation-test server. Never reads a hosted or normal local database.
import {randomUUID,randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {unlinkSync} from 'node:fs';
import net from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
export async function themeTestServer(){
 process.env.TURSO_DATABASE_URL='';process.env.TURSO_AUTH_TOKEN='';process.env.VERCEL='';process.env.BLOB_READ_WRITE_TOKEN='';
 process.env.DATABASE_PATH='data/theme-test-'+randomUUID()+'.sqlite';process.env.SESSION_SECRET=randomBytes(48).toString('hex');process.env.GOOGLE_CLIENT_ID='test-client';
 const {sqlite,localDatabase}=await import('./local-database.mjs');
 const {migrateFavorites}=await import('./migrate-favorites.mjs');await migrateFavorites(localDatabase);
 const {programs}=await import('../lib/programs.ts');
 for(const p of programs)sqlite.prepare('INSERT OR IGNORE INTO programs(slug,name,major) VALUES(?,?,?)').run(p.slug,p.name,p.major);
 const program=sqlite.prepare('SELECT id FROM programs LIMIT 1').get();
 const paper=Number(sqlite.prepare("INSERT INTO research_papers(slug,title,year,program_id,abstract,status,keywords) VALUES('theme-fixture','Presentation test paper',2025,?,'Isolated test abstract','verified','[\"presentation\"]')").run(program.id).lastInsertRowid);
 const author=Number(sqlite.prepare("INSERT INTO authors(name,given_name,family_name) VALUES('Test Reader','Test','Reader')").run().lastInsertRowid);
 sqlite.prepare('INSERT INTO research_paper_authors(paper_id,author_id,position) VALUES(?,?,0)').run(paper,author);
 sqlite.prepare("INSERT INTO research_papers(slug,title,year,program_id,status) VALUES('theme-pending','Pending presentation test',2025,?,'pending')").run(program.id);
 const {newSession,SESSION_COOKIE}=await import('../lib/google-session.mjs');const sessions={};
 for(const role of ['admin','public']){const id=randomUUID();sqlite.prepare('INSERT INTO users(id,email,name,google_sub,password_hash,password_salt,role,created_at) VALUES(?,?,?,?,?,?,?,0)').run(id,role+'@example.com','Test '+role,id,'','',role);sessions[role]=await newSession(id);if(role==='public')sqlite.prepare('INSERT INTO bookmarks(user_id,paper_id,created_at) VALUES(?,?,?)').run(id,paper,Date.now());}
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));const base='http://localhost:'+port;
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env:{...process.env,NODE_ENV:'production'},windowsHide:true,stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
 const close=async()=>{server.kill();if(server.exitCode===null)await new Promise(r=>server.once('exit',r));sqlite.close();for(const suffix of ['','-wal','-shm'])try{unlinkSync(process.env.DATABASE_PATH+suffix);}catch{}};
 for(let i=0;i<120;i++){try{if((await fetch(base+'/login')).ok)return {base,sessions,cookie:SESSION_COOKIE,close};}catch{}await delay(250);}
 await close();throw new Error('Presentation test server did not start: '+logs);
}
