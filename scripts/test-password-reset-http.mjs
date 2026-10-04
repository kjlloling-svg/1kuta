import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes,randomUUID} from 'node:crypto';
import {createServer} from 'node:net';
import {setTimeout as pause} from 'node:timers/promises';
import bcrypt from 'bcryptjs';
import {createPasswordResetService,RESET_MESSAGE} from '../lib/password-reset.mjs';

// No production database or email credentials are used by this smoke test.
process.env.DATABASE_PATH=`.sync/reset-http-${randomUUID()}/fixture.sqlite`;
process.env.SESSION_SECRET=randomBytes(48).toString('hex');
process.env.PASSWORD_RESET_SECRET=randomBytes(48).toString('hex');
for(const name of ['VERCEL','TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BLOB_READ_WRITE_TOKEN'])process.env[name]='';
for(const name of ['GMAIL_CLIENT_ID','GMAIL_CLIENT_SECRET','GMAIL_REFRESH_TOKEN'])process.env[name]='fixture';
process.env.GMAIL_SENDER_EMAIL='fixture@example.invalid';
const {sqlite,localDatabase}=await import('./local-database.mjs');
const id=randomUUID(),email=id+'@example.invalid',password=randomBytes(24).toString('hex');
sqlite.prepare('INSERT INTO users(id,email,password_hash,password_salt,created_at,name,role) VALUES (?,?,?,?,?,?,?)').run(id,email,await bcrypt.hash('old-'+password,12),'',1,'Reset fixture','public');
const service=createPasswordResetService({db:localDatabase,secret:process.env.PASSWORD_RESET_SECRET});
const challenge=await service.request(email,'fixture');
const socket=createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
const base=`http://localhost:${port}`;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env:{...process.env,NODE_ENV:'production'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',chunk=>{output+=chunk;});server.stderr.on('data',chunk=>{output+=chunk;});
const post=(body,origin=base)=>fetch(base+'/api/auth/password-reset',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base+'/login')).ok){ready=true;break;}}catch{}if(server.exitCode!==null)break;await pause(500);}
 assert.ok(ready,'Production server did not start');
 assert.match(await (await fetch(base+'/login')).text(),/Forgot password\?/);
 const form=await fetch(base+'/forgot-password');assert.equal(form.status,200);assert.match(await form.text(),/Send code/);
 assert.equal((await post({action:'request',email},'https://untrusted.invalid')).status,403);
 assert.equal((await post({action:'request',email:'invalid'})).status,400);
 const unknown=await post({action:'request',email:'unknown@example.invalid'});assert.equal(unknown.status,200);assert.equal(unknown.headers.get('cache-control'),'no-store');assert.equal((await unknown.json()).message,RESET_MESSAGE);
 // The existing account is in its resend cooldown, so this sends no email.
 const existing=await post({action:'request',email});assert.equal(existing.status,200);assert.equal((await existing.json()).message,RESET_MESSAGE);
 const bad=await post({action:'verify',email,code:challenge.code==='000000'?'000001':'000000'});assert.equal(bad.status,400);
 const verified=await post({action:'verify',email,code:challenge.code});assert.equal(verified.status,200);const {ticket}=await verified.json();
 assert.equal((await post({action:'verify',email,code:challenge.code})).status,400);
 assert.equal((await post({action:'reset',email,ticket,password,confirm:password})).status,200);
 assert.equal((await post({action:'reset',email,ticket,password,confirm:password})).status,400);
 const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({identifier:email,password})});assert.equal(login.status,200);
 console.log('PASS: production pages, login link, same-origin protection, email validation, identical request responses, no-store headers, verify/reset/replay, new-password login');
 assert.ok(!output.includes('Password reset delivery failed'),'Unexpected mail attempt');
}finally{server.kill();if(server.exitCode===null)await once(server,'exit');sqlite.close();}
