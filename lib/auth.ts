import {SESSION_COOKIE,SESSION_SECONDS,sessionUser,newSession,deleteSession} from './google-session.mjs';
import {limited} from './google-challenge.mjs';
import { createHmac } from 'node:crypto';
import { cookies } from 'next/headers';

export {SESSION_COOKIE,SESSION_SECONDS};


function hex(bytes: Uint8Array) { return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join(''); }
export async function sha256(value: string) { const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error('Session secret missing');return createHmac('sha256',secret).update(value).digest('hex'); }
export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length<=254; }
export function safeReturnTo(value: unknown) {
  if (typeof value!=='string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try { const url=new URL(value,'https://archive.invalid'); return url.origin==='https://archive.invalid' && !/^\/(?:api|login|register)(?:\/|$)/.test(url.pathname) ? `${url.pathname}${url.search}${url.hash}` : '/'; }
  catch { return '/'; }
}
export function sameOrigin(request: Request) {
  const origin=request.headers.get('origin');
  return !!origin && origin===new URL(request.url).origin;
}

export function randomHex(length=32) { const bytes=new Uint8Array(length);crypto.getRandomValues(bytes);return hex(bytes); }
export async function getCurrentUser() {
 return await sessionUser((await cookies()).get(SESSION_COOKIE)?.value) as {id:string;email:string;role:'admin'|'public';name:string;picture:string|null}|null;
}
export async function requireAdmin(){const user=await getCurrentUser();return user?.role==='admin'?user:null;}
export const createSession=newSession;
export async function clearSession(){await deleteSession((await cookies()).get(SESSION_COOKIE)?.value);}
export const rateLimited=limited;
