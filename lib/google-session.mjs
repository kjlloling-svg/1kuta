import {createHmac,randomBytes} from 'node:crypto';
import {runtimeDatabase as db} from './runtime-database.mjs';
export const SESSION_COOKIE='kuta_google_session';
export const SESSION_SECONDS=3600;
export function digest(value){
 const secret=process.env.SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error('Session secret missing');
 return createHmac('sha256',secret).update(value).digest('hex');
}
// A new cookie and hash namespace invalidate all old password-authenticated sessions.
export async function sessionUser(token){
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 return db.prepare("SELECT u.id,u.email,u.role,u.name,u.picture FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.google_sub IS NOT NULL AND u.google_sub<>'' LIMIT 1").bind(digest('google-session:'+token),Math.floor(Date.now()/1000)).first();
}
export async function newSession(userId,seconds=SESSION_SECONDS){
 const token=randomBytes(32).toString('hex');
 await db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(digest('google-session:'+token),userId,Math.floor(Date.now()/1000)+Math.min(seconds,SESSION_SECONDS)).run();
 return token;
}
export async function deleteSession(token){
 if(token&&/^[a-f0-9]{64}$/.test(token))await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(digest('google-session:'+token)).run();
}
