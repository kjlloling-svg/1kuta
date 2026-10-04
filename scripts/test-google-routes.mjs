import assert from 'node:assert/strict';
import {randomUUID,randomBytes,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import {OAuth2Client} from 'google-auth-library';
import {NextRequest} from 'next/server.js';
process.env.TURSO_DATABASE_URL='';process.env.TURSO_AUTH_TOKEN='';process.env.VERCEL='';process.env.BLOB_READ_WRITE_TOKEN='';
process.env.DATABASE_PATH='data/google-routes-test-'+randomUUID()+'.sqlite';process.env.SESSION_SECRET=randomBytes(48).toString('hex');process.env.GOOGLE_CLIENT_ID='test-client';
const folder=path.resolve('.sync/google-route-tests');mkdirSync(folder,{recursive:true});
const url=p=>pathToFileURL(path.resolve(p)).href;
const output=[];
function compile(file,name,transform){const dest=path.join(folder,name);writeFileSync(dest,ts.transpileModule(transform(readFileSync(file,'utf8')),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);output.push(dest);return url(dest);}
const auth=compile('lib/auth.ts','auth.mjs',s=>s.replaceAll("'next/headers'","'next/headers.js'").replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(url('lib/'+p))));
const google=compile('lib/google-auth.ts','google.mjs',s=>s.replace("import { env } from './local-env';",'import {runtimeDatabase} from '+JSON.stringify(url('lib/runtime-database.mjs'))+';const env={DB:runtimeDatabase};'));
const route=compile('app/api/auth/google/route.ts','route.mjs',s=>s.replaceAll("'next/server'","'next/server.js'").replace("'@/lib/auth'",JSON.stringify(auth)).replace("'@/lib/google-auth'",JSON.stringify(google)).replace(/'@\/(lib\/[^']+)'/g,(_,p)=>JSON.stringify(url(p))));
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const original=OAuth2Client.prototype.getFederatedSignonCertsAsync;OAuth2Client.prototype.getFederatedSignonCertsAsync=async()=>({certs:{test:publicKey.export({type:'spki',format:'pem'})},format:'PEM'});
const {sqlite}=await import('./local-database.mjs');
const {sessionUser}=await import('../lib/google-session.mjs');
const {GET,POST}=await import(route);
const base='http://localhost:3219';
function request(body,cookie='',origin=base){return new NextRequest(base+'/api/auth/google',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:JSON.stringify(body)});}
function jwt(nonce,email,sub=randomUUID()){
 const now=Math.floor(Date.now()/1000),data=[{alg:'RS256',kid:'test'},{iss:'https://accounts.google.com',aud:'test-client',sub,email,email_verified:true,iat:now,exp:now+3600,nonce}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 return data+'.'+sign('RSA-SHA256',Buffer.from(data),privateKey).toString('base64url');
}
async function begin(email){const response=email?await POST(request({action:'begin',email})):await GET(new NextRequest(base+'/api/auth/google'));assert.equal(response.status,200);const data=await response.json();return {nonce:data.nonce,cookie:'kuta_google_nonce='+response.cookies.get('kuta_google_nonce').value};}
try{
 let b=await begin('reader@example.com');let r=await POST(request({credential:jwt(b.nonce,'reader@example.com'),return_to:'/research-papers'},b.cookie));assert.equal(r.status,200);assert.equal((await r.json()).redirectTo,'/research-papers');assert.equal((await sessionUser(r.cookies.get('kuta_google_session').value)).role,'public');
 assert.equal((await POST(request({credential:jwt(b.nonce,'reader@example.com')},b.cookie))).status,401);
 b=await begin('expected@example.com');assert.equal((await POST(request({credential:jwt(b.nonce,'different@example.com')},b.cookie))).status,400);
 b=await begin();r=await POST(request({credential:jwt(b.nonce,'signin@example.com'),return_to:'//evil.invalid'},b.cookie));assert.equal(r.status,200);assert.equal((await r.json()).redirectTo,'/');
 assert.equal((await POST(request({action:'begin',email:'bad-email'}))).status,400);
 assert.equal((await POST(request({action:'begin',email:'valid@example.com'},'','https://evil.invalid'))).status,403);
 for(let i=0;i<5;i++)assert.equal((await POST(request({action:'begin',email:'limited@example.com'}))).status,200);
 assert.equal((await POST(request({action:'begin',email:'limited@example.com'}))).status,429);
 b=await begin();assert.equal((await POST(request({credential:jwt(b.nonce,'limited@example.com')},b.cookie))).status,429);
 sqlite.prepare("INSERT INTO users(id,email,password_hash,password_salt,role,created_at) VALUES('legacy','legacy@example.com','','','admin',0)").run();b=await begin();assert.equal((await POST(request({credential:jwt(b.nonce,'legacy@example.com')},b.cookie))).status,409);
 b=await begin();assert.equal((await POST(request({credential:'invalid'},b.cookie))).status,401);
 console.log('PASS: actual Google route create/sign-in, cookie, email binding, replay, redirect, validation, origin, per-email limits on both flows, legacy admin collision and invalid credentials');
}finally{OAuth2Client.prototype.getFederatedSignonCertsAsync=original;sqlite.close();for(const p of output)unlinkSync(p);for(const suffix of ['','-wal','-shm'])try{unlinkSync(process.env.DATABASE_PATH+suffix);}catch{}}
