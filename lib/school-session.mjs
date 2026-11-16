import {createHmac} from 'node:crypto';
import {runtimeDatabase as db} from './runtime-database.mjs';
import {prepareAccounts,schoolEmail} from './institutional-schema.mjs';

export const SESSION_COOKIE='kuta_school_session';
export const SESSION_SECONDS=3600;
export function digest(value) {
  const key = process.env.SESSION_SECRET;
  if (!key || key.length < 32) throw new Error('Session secret missing');
  return createHmac('sha256',key).update(value).digest('hex');
}
export async function sessionUser(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  await prepareAccounts();
  const user = await db.prepare(`SELECT u.id,u.email,u.role,u.name,u.picture FROM sessions s
    JOIN users u ON u.id=s.user_id JOIN institutional_accounts a ON a.user_id=u.id
    WHERE s.token_hash=? AND s.expires_at>?`).bind(digest('school-session:'+token), Math.floor(Date.now()/1000)).first();
  return user && schoolEmail(user.email) ? user : null;
}
export async function deleteSession(token) {
  if (token) await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(digest('school-session:'+token)).run();
}
