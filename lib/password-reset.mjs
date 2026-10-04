import {createHmac,randomInt,randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';

export const RESET_MESSAGE='If this email exists, we sent a code.';
export class ResetError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export function resetEmail(value){
 if(typeof value!=='string')throw new ResetError('Enter a valid email address.');
 const email=value.trim().toLowerCase();
 if(email.length>254||! /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email))throw new ResetError('Enter a valid email address.');
 return email;
}
export function createPasswordResetService({db,secret,now=()=>Math.floor(Date.now()/1000)}){
 if(!secret||secret.length<32)throw new Error('Password reset is not configured');
 const digest=(purpose,value)=>createHmac('sha256',secret).update(purpose+':'+value).digest('hex');
 const stmt=(sql,...args)=>db.prepare(sql).bind(...args);
 async function ready(){
  await db.batch([
   stmt(`CREATE TABLE IF NOT EXISTS password_resets (email_key TEXT PRIMARY KEY,user_id TEXT,otp_hash TEXT,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,sent_at INTEGER NOT NULL,reset_hash TEXT,reset_expires_at INTEGER,completion_id TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`),
   stmt('CREATE TABLE IF NOT EXISTS password_reset_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,window_start INTEGER NOT NULL)')
  ]);
 }
 async function limited(key,limit,seconds){
  const row=await stmt(`INSERT INTO password_reset_limits(key,count,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET
   count=CASE WHEN excluded.window_start-password_reset_limits.window_start>=? THEN 1 ELSE MIN(password_reset_limits.count+1,?) END,
   window_start=CASE WHEN excluded.window_start-password_reset_limits.window_start>=? THEN excluded.window_start ELSE password_reset_limits.window_start END RETURNING count`,digest('limit',key),now(),seconds,limit+1,seconds).first();
  return !row||row.count>limit;
 }
 async function request(email,ip){
  email=resetEmail(email);await ready();
  if(await limited('request-ip:'+ip,10,900))throw new ResetError('Too many requests. Please wait 15 minutes and try again.',429);
  if(await limited('request-email:'+email,3,900))return null;
  const emailKey=digest('email',email),time=now();
  const user=await stmt('SELECT id FROM users WHERE email=?',email).first();
  const code=String(randomInt(1000000)).padStart(6,'0'),otpHash=digest('otp',emailKey+':'+code);
  // The same cooldown/storage work runs for registered and unregistered emails.
  const accepted=await stmt(`INSERT INTO password_resets(email_key,user_id,otp_hash,expires_at,attempts,sent_at) VALUES (?,?,?,?,0,?)
   ON CONFLICT(email_key) DO UPDATE SET user_id=excluded.user_id,otp_hash=excluded.otp_hash,expires_at=excluded.expires_at,attempts=0,sent_at=excluded.sent_at,reset_hash=NULL,reset_expires_at=NULL,completion_id=NULL
   WHERE password_resets.sent_at<=excluded.sent_at-60 RETURNING email_key`,emailKey,user?.id||null,otpHash,time+600,time).first();
  if(!accepted)return null;
  await db.batch([stmt('DELETE FROM password_resets WHERE expires_at<? AND (reset_expires_at IS NULL OR reset_expires_at<?)',time-86400,time-86400),stmt('DELETE FROM password_reset_limits WHERE window_start<?',time-172800)]);
  if(!user||await limited('sender-daily',450,86400))return null;
  return {email,emailKey,code,otpHash};
 }
 async function deliver(delivery,send){
  if(!delivery)return;
  const {email,emailKey,code,otpHash}=delivery;
  const current=await stmt('SELECT email_key FROM password_resets WHERE email_key=? AND otp_hash=? AND expires_at>?',emailKey,otpHash,now()).first();
  if(!current)return;
  try{await send(email,code);}catch{
   // Invalidate a failed delivery without destroying a newer concurrent request.
   await stmt('UPDATE password_resets SET otp_hash=NULL WHERE email_key=? AND otp_hash=?',emailKey,otpHash).run();
   throw new Error('Password reset email delivery failed');
  }
 }
 async function verify(email,code,ip){
  email=resetEmail(email);await ready();
  if(await limited('verify-ip:'+ip,30,900))throw new ResetError('Too many attempts. Please wait 15 minutes and try again.',429);
  if(typeof code!=='string'||!/^\d{6}$/.test(code))throw new ResetError('Enter the six-digit code from your email.');
  const emailKey=digest('email',email),otpHash=digest('otp',emailKey+':'+code);
  const ticket=randomBytes(32).toString('hex'),ticketHash=digest('ticket',ticket),time=now();
  // Comparison, attempt counting and OTP consumption are one atomic statement.
  const row=await stmt(`UPDATE password_resets SET attempts=attempts+1,
   reset_hash=CASE WHEN otp_hash=? THEN ? ELSE reset_hash END,
   reset_expires_at=CASE WHEN otp_hash=? THEN ? ELSE reset_expires_at END,
   otp_hash=CASE WHEN otp_hash=? THEN NULL ELSE otp_hash END
   WHERE email_key=? AND otp_hash IS NOT NULL AND attempts<5 AND expires_at>?
   AND EXISTS(SELECT 1 FROM users WHERE id=password_resets.user_id AND email=?) RETURNING reset_hash`,otpHash,ticketHash,otpHash,time+300,otpHash,emailKey,time,email).first();
  if(!row||row.reset_hash!==ticketHash)throw new ResetError('The code is incorrect, expired, or no longer usable. Request a new code if needed.');
  return ticket;
 }
 async function reset(email,ticket,password,confirm,ip){
  email=resetEmail(email);await ready();
  if(await limited('reset-ip:'+ip,20,900))throw new ResetError('Too many attempts. Please wait 15 minutes and try again.',429);
  if(typeof password!=='string'||password.length<12||password.length>128||Buffer.byteLength(password,'utf8')>72)throw new ResetError('Use at least 12 characters, up to 72 bytes (some characters use more than one byte).');
  if(password!==confirm)throw new ResetError('The passwords do not match.');
  if(typeof ticket!=='string'||! /^[a-f0-9]{64}$/.test(ticket))throw new ResetError('Please verify a new code before resetting your password.');
  const emailKey=digest('email',email),ticketHash=digest('ticket',ticket),completion=randomBytes(32).toString('hex'),hash=await bcrypt.hash(password,12);
  // Batch is a database transaction on both Turso and local SQLite. Only its winner
  // can change the password or revoke sessions; replay/concurrent calls do nothing.
  const results=await db.batch([
   stmt(`UPDATE password_resets SET completion_id=?,reset_hash=NULL,reset_expires_at=NULL WHERE email_key=? AND reset_hash=? AND reset_expires_at>?
    AND EXISTS(SELECT 1 FROM users WHERE id=password_resets.user_id AND email=?)`,completion,emailKey,ticketHash,now(),email),
   stmt('UPDATE users SET password_hash=?,password_salt=\'\' WHERE id IN (SELECT user_id FROM password_resets WHERE email_key=? AND completion_id=?)',hash,emailKey,completion),
   stmt('DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM password_resets WHERE email_key=? AND completion_id=?)',emailKey,completion),
   stmt('DELETE FROM password_resets WHERE email_key=? AND completion_id=?',emailKey,completion)
  ]);
  if(results[0].meta.changes!==1||results[1].meta.changes!==1)throw new ResetError('This reset has expired or already been used. Request a new code.');
 }
 return {request,deliver,verify,reset};
}
