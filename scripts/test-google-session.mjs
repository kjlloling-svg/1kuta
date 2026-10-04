import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {unlinkSync} from 'node:fs';
process.env.TURSO_DATABASE_URL='';process.env.TURSO_AUTH_TOKEN='';process.env.VERCEL='';process.env.BLOB_READ_WRITE_TOKEN='';
process.env.DATABASE_PATH='data/google-session-test-'+randomUUID()+'.sqlite';
process.env.SESSION_SECRET=randomBytes(48).toString('hex');
const {sqlite}=await import('./local-database.mjs');
const {newSession,sessionUser,deleteSession,digest}=await import('../lib/google-session.mjs');
const {beginChallenge,consumeChallenge,limited}=await import('../lib/google-challenge.mjs');
try{
 const id=randomUUID();sqlite.prepare("INSERT INTO users(id,email,google_sub,password_hash,password_salt,role,created_at) VALUES(?,?,?,'','','public',?)").run(id,'test@example.com','verified-sub',Math.floor(Date.now()/1000));
 const token=await newSession(id);assert.equal((await sessionUser(token)).id,id);assert.equal(await sessionUser('fake'),null);
 sqlite.prepare("UPDATE users SET role='admin' WHERE id=?").run(id);assert.equal((await sessionUser(token)).role,'admin');
 sqlite.prepare('UPDATE sessions SET expires_at=0').run();assert.equal(await sessionUser(token),null);
 const fresh=await newSession(id);await deleteSession(fresh);assert.equal(await sessionUser(fresh),null);
 const legacy=randomBytes(32).toString('hex');sqlite.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(legacy),id,Math.floor(Date.now()/1000)+3600);assert.equal(await sessionUser(legacy),null);
 sqlite.prepare('UPDATE users SET google_sub=NULL WHERE id=?').run(id);assert.equal(await sessionUser(await newSession(id)),null);
 const nonce=await beginChallenge('bound@example.com');const results=await Promise.all([consumeChallenge(nonce),consumeChallenge(nonce)]);assert.equal(results.filter(Boolean).length,1);assert.equal(results.find(Boolean).email,'bound@example.com');
 const expired=await beginChallenge();sqlite.prepare('UPDATE google_auth_challenges SET expires_at=0').run();assert.equal(await consumeChallenge(expired),null);
 for(let i=0;i<5;i++)assert.equal(await limited('email-test',5,3600),false);assert.equal(await limited('email-test',5,3600),true);
 sqlite.prepare('UPDATE login_attempts SET window_start=window_start-3601').run();assert.equal(await limited('email-test',5,3600),false);
 console.log('PASS: session expiry, revocation, live roles, old sessions, Google-only identities, atomic challenge replay protection, expiry and hourly limits');
}finally{sqlite.close();for(const suffix of ['','-wal','-shm'])try{unlinkSync(process.env.DATABASE_PATH+suffix);}catch{}}
