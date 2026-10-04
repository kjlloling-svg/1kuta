import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {createClient} from '@libsql/client';
import bcrypt from 'bcryptjs';
import {google} from 'googleapis';
import {createRemoteDatabase} from '../lib/runtime-database.mjs';
import {createPasswordResetService,ResetError,resetEmail} from '../lib/password-reset.mjs';
import {sendResetCode} from '../lib/gmail-reset.mjs';

const client=createClient({url:':memory:'}),db=createRemoteDatabase(client);
await client.executeMultiple('CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT,password_salt TEXT,role TEXT,google_sub TEXT); CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id TEXT,expires_at INTEGER);');
let time=1000000;const secret=randomBytes(48).toString('hex');
const service=createPasswordResetService({db,secret,now:()=>time});
const second=createPasswordResetService({db,secret,now:()=>time});
const password=randomBytes(24).toString('hex');
async function account(googleOnly=false){const id=randomUUID(),email=id+'@example.invalid';await db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').bind(id,email,googleOnly?'':await bcrypt.hash('old-'+password,12),'','admin',googleOnly?'google-'+id:null).run();return {id,email};}
async function begin(email,ip=randomUUID()){const delivery=await service.request(email,ip);assert.ok(delivery);assert.match(delivery.code,/^\d{6}$/);return delivery;}
try{
 const user=await account();const delivery=await begin(user.email);
 const stored=(await client.execute('SELECT * FROM password_resets')).rows[0];assert.notEqual(stored.otp_hash,delivery.code);assert.equal(stored.otp_hash.length,64);assert.equal(stored.expires_at-time,600);
 let mail;await service.deliver(delivery,async(email,code)=>{mail={email,code};});assert.equal(mail.email,user.email);assert.equal(mail.code,delivery.code);
 assert.equal(await service.request(user.email,randomUUID()),null);
 time+=60;const resent=await begin(user.email);await assert.rejects(()=>service.verify(user.email,delivery.code,randomUUID()),ResetError);
 const ticket=await second.verify(user.email,resent.code,randomUUID());
 await assert.rejects(()=>service.verify(user.email,resent.code,randomUUID()),ResetError);
 await db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind('old-session',user.id,time+9999).run();
 await assert.rejects(()=>service.reset(user.email,ticket,password,'different',randomUUID()),ResetError);
 await assert.rejects(()=>service.reset(user.email,ticket,'short','short',randomUUID()),ResetError);
 await service.reset(user.email,ticket,password,password,randomUUID());
 const updated=await db.prepare('SELECT * FROM users WHERE id=?').bind(user.id).first();assert.ok(await bcrypt.compare(password,updated.password_hash));assert.equal(updated.role,'admin');assert.equal((await client.execute('SELECT COUNT(*) n FROM sessions')).rows[0].n,0);
 await assert.rejects(()=>service.reset(user.email,ticket,password,password,randomUUID()),ResetError);
 console.log('PASS: hashed codes, 60-second cooldown, resend invalidation, cross-instance verification, one-use codes/tickets, password policy, password hashing and session revocation');

 const locked=await account(),lockCode=await begin(locked.email),wrong=lockCode.code==='000000'?'000001':'000000';
 const failures=await Promise.allSettled(Array.from({length:5},()=>service.verify(locked.email,wrong,randomUUID())));assert.ok(failures.every(r=>r.status==='rejected'));
 await assert.rejects(()=>service.verify(locked.email,lockCode.code,randomUUID()),ResetError);
 const expired=await account(),old=await begin(expired.email);time+=600;await assert.rejects(()=>service.verify(expired.email,old.code,randomUUID()),ResetError);
 const grant=await account(),grantCode=await begin(grant.email),grantTicket=await service.verify(grant.email,grantCode.code,randomUUID());time+=300;await assert.rejects(()=>service.reset(grant.email,grantTicket,password,password,randomUUID()),ResetError);
 console.log('PASS: five parallel wrong attempts lock the code; exact OTP and reset-ticket expiry boundaries enforced');

 const race=await account(),raceCode=await begin(race.email);
 const checks=await Promise.allSettled([service.verify(race.email,raceCode.code,randomUUID()),second.verify(race.email,raceCode.code,randomUUID())]);assert.equal(checks.filter(r=>r.status==='fulfilled').length,1);
 const raceTicket=checks.find(r=>r.status==='fulfilled').value;
 const resets=await Promise.allSettled([service.reset(race.email,raceTicket,password,password,randomUUID()),second.reset(race.email,raceTicket,password,password,randomUUID())]);assert.equal(resets.filter(r=>r.status==='fulfilled').length,1);
 const googleUser=await account(true),googleCode=await begin(googleUser.email),googleTicket=await service.verify(googleUser.email,googleCode.code,randomUUID());await service.reset(googleUser.email,googleTicket,password,password,randomUUID());const googleRow=await db.prepare('SELECT * FROM users WHERE id=?').bind(googleUser.id).first();assert.ok(await bcrypt.compare(password,googleRow.password_hash));assert.equal(googleRow.google_sub,'google-'+googleUser.id);
 console.log('PASS: simultaneous verification/reset has one winner; Google-only account can set password without changing role or Google identity');

 assert.equal(await service.request('absent@example.invalid',randomUUID()),null);
 await assert.rejects(()=>service.verify('absent@example.invalid','123456',randomUUID()),ResetError);
 const failed=await account(),failedCode=await begin(failed.email);await assert.rejects(()=>service.deliver(failedCode,async()=>{throw Error('provider error with private details');}),/delivery failed/);await assert.rejects(()=>service.verify(failed.email,failedCode.code,randomUUID()),ResetError);
 const mismatch=await account(),mismatchCode=await begin(mismatch.email);await db.prepare('UPDATE users SET email=? WHERE id=?').bind('changed-'+mismatch.email,mismatch.id).run();await assert.rejects(()=>service.verify(mismatch.email,mismatchCode.code,randomUUID()),ResetError);
 const rate=await account();await begin(rate.email);time+=60;await begin(rate.email);time+=60;await begin(rate.email);time+=60;assert.equal(await service.request(rate.email,randomUUID()),null);
 const ip=randomUUID();for(let i=0;i<10;i++)await service.request(`unknown-${i}@example.invalid`,ip);await assert.rejects(()=>service.request('unknown-last@example.invalid',ip),e=>e.status===429);
 assert.throws(()=>resetEmail('mail@example.com\r\nBcc: victim@example.com'),ResetError);
 console.log('PASS: unknown addresses, delivery failure invalidation, changed email, per-email/per-IP request limits and header-injection rejection');

 const original=google.gmail;const names=['GMAIL_CLIENT_ID','GMAIL_CLIENT_SECRET','GMAIL_REFRESH_TOKEN','GMAIL_SENDER_EMAIL'];const previous=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 try{
  for(const name of names)process.env[name]='fixture';process.env.GMAIL_SENDER_EMAIL='sender@example.invalid';
  let captured;google.gmail=()=>({users:{messages:{send:async(params)=>{captured=params;}}}});
  await sendResetCode('recipient@example.invalid','012345');const raw=Buffer.from(captured.requestBody.raw,'base64url').toString();assert.match(raw,/Subject: Your verification code/);assert.match(raw,/012345/);assert.match(raw,/expires in 10 minutes/);assert.equal(captured.userId,'me');
 }finally{google.gmail=original;for(const name of names)if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}
 console.log('PASS: Gmail API message format and six-digit leading-zero code (mock transport; no real email sent)');
}finally{client.close();}
