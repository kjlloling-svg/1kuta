import {randomBytes} from 'node:crypto';
import {runtimeDatabase as db} from './runtime-database.mjs';
import {digest} from './google-session.mjs';
async function schema(){
 await db.prepare('CREATE TABLE IF NOT EXISTS google_auth_challenges (nonce_hash TEXT PRIMARY KEY,email TEXT,expires_at INTEGER NOT NULL)').run();
}
/** @param {string|null} email */
export async function beginChallenge(email=null){
 await schema();
 const now=Math.floor(Date.now()/1000),nonce=randomBytes(32).toString('hex');
 await db.prepare('DELETE FROM google_auth_challenges WHERE expires_at<=?').bind(now).run();
 await db.prepare('INSERT INTO google_auth_challenges VALUES (?,?,?)').bind(digest('google-nonce:'+nonce),email,now+600).run();
 return nonce;
}
export async function consumeChallenge(nonce){
 if(!nonce||!/^[a-f0-9]{64}$/.test(nonce))return null;
 await schema();
 // DELETE RETURNING makes replay prevention atomic across serverless instances.
 return db.prepare('DELETE FROM google_auth_challenges WHERE nonce_hash=? AND expires_at>? RETURNING email').bind(digest('google-nonce:'+nonce),Math.floor(Date.now()/1000)).first();
}
export async function limited(key,limit,windowSeconds=900){
 const now=Math.floor(Date.now()/1000);
 const row=await db.prepare(`INSERT INTO login_attempts (key,count,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET
 count=CASE WHEN excluded.window_start-login_attempts.window_start>=? THEN 1 ELSE MIN(login_attempts.count+1,?) END,
 window_start=CASE WHEN excluded.window_start-login_attempts.window_start>=? THEN excluded.window_start ELSE login_attempts.window_start END RETURNING count`)
 .bind(digest(key),now,windowSeconds,limit+1,windowSeconds).first();
 return !row||row.count>limit;
}
export function audit(outcome,reason){console.info(JSON.stringify({event:'google_auth',outcome,reason,time:new Date().toISOString()}));}
