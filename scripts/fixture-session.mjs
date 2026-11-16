import {randomBytes} from 'node:crypto';
import {sqlite} from './local-database.mjs';
import {prepareAccounts,schoolEmail} from '../lib/institutional-schema.mjs';
import {SESSION_COOKIE,digest,SESSION_SECONDS} from '../lib/school-session.mjs';
export {SESSION_COOKIE,digest};
// Only local test records with empty password fields can use this fixture.
export async function newSession(id){
  if(process.env.TURSO_DATABASE_URL || process.env.VERCEL) throw Error('Local test database required');
  const user=sqlite.prepare("SELECT email FROM users WHERE id=? AND password_hash=''").get(id);
  if(!user || !schoolEmail(user.email)) throw Error('Expected an institutional test user');
  await prepareAccounts();
  sqlite.prepare('INSERT OR IGNORE INTO institutional_accounts(user_id,program) VALUES(?,?)').run(id,'bsed-mathematics');
  const token=randomBytes(32).toString('hex');
  sqlite.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(digest('school-session:'+token),id,Math.floor(Date.now()/1000)+SESSION_SECONDS);
  return token;
}
