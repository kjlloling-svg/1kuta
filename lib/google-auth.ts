import { OAuth2Client } from 'google-auth-library';
import { env } from './local-env';

const verifier = new OAuth2Client();
export async function verifyGoogleToken(credential: string, nonce: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google configuration unavailable');
  const ticket = await verifier.verifyIdToken({ idToken: credential, audience: clientId });
  const profile = ticket.getPayload();
  if (!profile || !profile.sub || !profile.email || profile.email_verified !== true ||
      profile.exp <= Math.floor(Date.now()/1000) ||
      (profile as typeof profile & {nonce?: string}).nonce !== nonce) throw new Error('Invalid Google identity');
  return profile;
}

export async function saveGoogleUser(profile: {sub:string;email?:string;name?:string;picture?:string}) {
  const db=env.DB;
  const email=profile.email!.trim().toLowerCase();
  const existing=await db.prepare('SELECT id FROM users WHERE google_sub=?').bind(profile.sub).first();
  const collision=await db.prepare('SELECT id FROM users WHERE email=? AND (google_sub IS NULL OR google_sub<>?)').bind(email,profile.sub).first();
  if(collision) return null; // Never link a password/admin account merely by matching email.
  const id=existing?.id || crypto.randomUUID();
  const picture=profile.picture?.startsWith('https://')?profile.picture:null;
  await db.prepare(`INSERT INTO users (id,email,name,picture,google_sub,password_hash,password_salt,role,created_at)
    VALUES (?,?,?,?,?,'','','public',?) ON CONFLICT(google_sub) DO UPDATE SET
    email=excluded.email,name=excluded.name,picture=excluded.picture`)
    .bind(id,email,profile.name||email,picture,profile.sub,Math.floor(Date.now()/1000)).run();
  return (await db.prepare('SELECT id FROM users WHERE google_sub=?').bind(profile.sub).first())!.id as string;
}
