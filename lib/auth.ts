import { env } from './local-env';
import bcrypt from 'bcryptjs';
import { createHmac } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'slsu_archive_session';
export const SESSION_SECONDS = 60 * 60 * 24 * 14;


function database() { if (!env.DB) throw new Error('Authentication database unavailable'); return env.DB as unknown as D1Database; }
function hex(bytes: Uint8Array) { return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join(''); }
export async function sha256(value: string) { const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error('Session secret missing');return createHmac('sha256',secret).update(value).digest('hex'); }
export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length<=254; }
export function safeReturnTo(value: unknown) {
  if (typeof value!=='string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try { const url=new URL(value,'https://archive.invalid'); return url.origin==='https://archive.invalid' && !url.pathname.startsWith('/api/') ? `${url.pathname}${url.search}${url.hash}` : '/'; }
  catch { return '/'; }
}
export function sameOrigin(request: Request) {
  const origin=request.headers.get('origin');
  return !!origin && origin===new URL(request.url).origin;
}

export function randomHex(length=32) { const bytes=new Uint8Array(length);crypto.getRandomValues(bytes);return hex(bytes); }
export function constantTimeEqual(a:string,b:string) { if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0; }
export async function getCurrentUser() {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const hash=await sha256(token);
  const user=await database().prepare('SELECT u.id, u.email, u.role, u.name, u.picture FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? LIMIT 1').bind(hash,Math.floor(Date.now()/1000)).first<{id:string;email:string;role:'admin'|'public';name:string;picture:string|null}>();
  return user||null;
}
export async function requireAdmin(){ const user=await getCurrentUser(); return user?.role==='admin'?user:null; }
export async function createSession(userId:string, seconds=SESSION_SECONDS) {
  const token=randomHex();
  await database().prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await sha256(token),userId,Math.floor(Date.now()/1000)+seconds).run();
  return token;
}
export async function clearSession() {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  if(token && /^[a-f0-9]{64}$/.test(token)) await database().prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
}
export async function rateLimited(key:string,limit=6) {
  const now=Math.floor(Date.now()/1000), db=database(), hashed=await sha256(key);
  const row=await db.prepare('SELECT count, window_start FROM login_attempts WHERE key=?').bind(hashed).first<{count:number;window_start:number}>();
  if(row && now-row.window_start<900 && row.count>=limit)return true;
  const next=row && now-row.window_start<900?row.count+1:1;
  await db.prepare('INSERT INTO login_attempts (key,count,window_start) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count, window_start=excluded.window_start').bind(hashed,next,next===1?now:row!.window_start).run();
  return false;
}
export async function findUser(email:string) { return database().prepare('SELECT id,email,role,name,password_hash,password_salt FROM users WHERE email=? OR username=? LIMIT 1').bind(email,email).first<{id:string;email:string;role:'admin'|'public';name:string;password_hash:string;password_salt:string}>(); }
export async function registerUser(email:string,password:string) {
  const salt='', hash=await bcrypt.hash(password,12), id=crypto.randomUUID();
  await database().prepare('INSERT INTO users (id,email,password_hash,password_salt,created_at,name) VALUES (?,?,?,?,?,?)').bind(id,email,hash,salt,Math.floor(Date.now()/1000),email.split("@")[0]).run();
  return id;
}


