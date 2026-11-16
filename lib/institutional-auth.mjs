import {randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {runtimeDatabase as db} from './runtime-database.mjs';
import {prepareAccounts, schoolEmail} from './institutional-schema.mjs';
import {digest, SESSION_SECONDS} from './school-session.mjs';
import {sendCode} from './mail-code.mjs';

const derive = promisify(scrypt);
const clock = () => Math.floor(Date.now() / 1000);
const secret = () => randomBytes(32).toString('hex');
const resetMessage = 'If this email is registered, we sent a code.';
export class FormError extends Error {}
export function requireEmail(input) {
  const email = schoolEmail(input);
  if (!email) throw new FormError('Enter your institutional email ending in @slsu.edu.ph.');
  return email;
}
async function encodePassword(password, salt) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128)
    throw new FormError('Use a password between 8 and 128 characters.');
  return (await derive(password, salt, 64, {N:32768, r:8, p:3, maxmem:64*1024*1024})).toString('hex');
}
const activeUser = `SELECT u.* FROM users u JOIN institutional_accounts a ON a.user_id=u.id WHERE u.email=?`;
export async function startCode(purpose, email, details, deliver=sendCode) {
  email = requireEmail(email);
  await prepareAccounts();
  const now = clock();
  const signup = purpose === 'signup';
  const salt = signup ? secret() : null;
  const hash = signup ? await encodePassword(details.password, salt) : null;
  const name = signup ? String(details.name || '').trim() : null;
  if (signup && (!name || name.length > 120 || !details.program)) throw new FormError('Enter your full name and select your program.');
  const active = await db.prepare(activeUser).bind(email).first();
  if (signup && active) throw new FormError('This account is already registered. Sign in or use Forgot password.');
  await db.prepare('DELETE FROM institutional_codes WHERE expires_at<=?').bind(now).run();
  const flow = secret(), code = String(randomInt(1000000)).padStart(6,'0');
  const reservation = await db.prepare(`INSERT INTO institutional_codes
    (email,purpose,flow,code_hash,sent_at,expires_at,attempts,proof,name,program,hash,salt)
    VALUES(?,?,?,?,?,?,0,NULL,?,?,?,?) ON CONFLICT(email,purpose) DO UPDATE SET
      flow=excluded.flow,code_hash=excluded.code_hash,sent_at=excluded.sent_at,expires_at=excluded.expires_at,
      attempts=0,proof=NULL,name=excluded.name,program=excluded.program,hash=excluded.hash,salt=excluded.salt
    WHERE institutional_codes.sent_at<=?`).bind(email,purpose,flow,signup || active ? digest(flow+':'+code) : '',now,now+300,name,details.program || null,hash,salt,now-60).run();
  if (!reservation.meta.changes) throw new FormError('Wait 60 seconds from the last request before sending another code.');
  if (signup || active) {
    try { await deliver(email,code,purpose); }
    catch {
      console.error('KUTA verification email could not be sent.');
      await db.prepare("UPDATE institutional_codes SET code_hash='' WHERE flow=?").bind(flow).run();
      if (signup) throw new FormError('We could not send your code. Wait a minute, then try again.');
    }
  }
  return {flow,message:signup ? 'We sent a six-digit code to your institutional email.' : resetMessage};
}

export async function verifyCode(purpose, email, flow, code) {
  email = requireEmail(email);
  await prepareAccounts();
  const proof = secret(), now = clock();
  const codeHash = digest(flow+':'+code);
  // Count a wrong guess and consume a correct code in one write, even across simultaneous requests.
  const row = await db.prepare(`UPDATE institutional_codes SET attempts=attempts+1,
      proof=CASE WHEN code_hash=? THEN ? ELSE NULL END,
      expires_at=CASE WHEN code_hash=? THEN ? ELSE expires_at END,
      code_hash=CASE WHEN code_hash=? THEN '' ELSE code_hash END
    WHERE email=? AND purpose=? AND flow=? AND expires_at>? AND attempts<5 AND code_hash<>''
    RETURNING proof`).bind(codeHash,digest(proof),codeHash,now+300,codeHash,email,purpose,flow,now).first();
  if (!row?.proof) throw new FormError('That code is incorrect, expired, or used. Request a new code if needed.');
  if (purpose === 'reset') return {proof};
  await activateAccount(email, flow, proof);
  return {message:'Email verified. You can now sign in.'};
}

async function activateAccount(email, flow, proof) {
  // Preserve the ID and role of an earlier institutional account after its owner verifies the address.
  const condition = "c.email=? AND c.purpose='signup' AND c.flow=? AND c.proof=? AND c.expires_at>?";
  const args = [email,flow,digest(proof),clock()];
  const userId = randomUUID();
  const result = await db.batch([
    db.prepare(`INSERT INTO users(id,email,name,password_hash,password_salt,role,created_at)
      SELECT COALESCE((SELECT id FROM users WHERE lower(trim(email))=c.email),?),c.email,c.name,c.hash,c.salt,'public',?
      FROM institutional_codes c WHERE ${condition}
      ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,password_hash=excluded.password_hash,
      password_salt=excluded.password_salt WHERE users.id NOT IN (SELECT user_id FROM institutional_accounts)`)
      .bind(userId,clock(),...args),
    db.prepare(`INSERT OR IGNORE INTO institutional_accounts(user_id,program)
      SELECT u.id,c.program FROM institutional_codes c JOIN users u ON u.email=c.email WHERE ${condition}`).bind(...args),
    db.prepare("UPDATE institutional_codes SET proof=NULL,hash=NULL,salt=NULL,name=NULL,program=NULL WHERE flow=? AND proof=?").bind(flow,digest(proof)),
  ]);
  if (!result[0].meta.changes) throw new FormError('Please sign in or request a new sign-up code.');
}

export async function resetPassword(email, flow, proof, password) {
  email = requireEmail(email);
  await prepareAccounts();
  const salt = secret(), hash = await encodePassword(password,salt);
  const valid = `SELECT u.id FROM users u JOIN institutional_accounts a ON a.user_id=u.id
    JOIN institutional_codes c ON c.email=u.email WHERE c.email=? AND c.purpose='reset' AND c.flow=? AND c.proof=? AND c.expires_at>?`;
  const args = [email,flow,digest(proof),clock()];
  const result = await db.batch([
    db.prepare(`UPDATE users SET password_hash=?,password_salt=? WHERE id IN (${valid})`).bind(hash,salt,...args),
    db.prepare(`DELETE FROM sessions WHERE user_id IN (${valid})`).bind(...args),
    db.prepare("UPDATE institutional_codes SET proof=NULL WHERE email=? AND purpose='reset' AND flow=? AND proof=?").bind(email,flow,digest(proof)),
  ]);
  if (!result[0].meta.changes) throw new FormError('This reset has expired. Request a new code.');
}

export async function passwordLogin(email,password) {
  email = requireEmail(email);
  await prepareAccounts();
  const user = await db.prepare(activeUser).bind(email).first();
  const hash = await encodePassword(password,user?.password_salt || 'unregistered');
  if (!user || !timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(user.password_hash,'hex')))
    throw new FormError('The email or password is incorrect.');
  const token = secret();
  const result = await db.prepare(`INSERT INTO sessions(token_hash,user_id,expires_at)
    SELECT ?,id,? FROM users WHERE id=? AND email=? AND password_hash=?`).bind(digest('school-session:'+token),clock()+SESSION_SECONDS,user.id,email,hash).run();
  if (!result.meta.changes) throw new FormError('The password changed. Please sign in again.');
  return token;
}
