import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {unlinkSync} from 'node:fs';
Object.assign(process.env,{TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',VERCEL:'',SESSION_SECRET:randomUUID(),DATABASE_PATH:'data/auth-test-'+randomUUID()+'.sqlite'});
const {sqlite}=await import('./local-database.mjs');
const {startCode,verifyCode,passwordLogin,resetPassword}=await import('../lib/institutional-auth.mjs');
const {sessionUser}=await import('../lib/school-session.mjs');
const email='reader@slsu.edu.ph', password='initial test password';
const details={name:'Test Reader',program:'bsed-mathematics',password};
let code;
const mail=async (to,value)=>{assert.equal(to,email);assert.match(value,/^\d{6}$/);code=value;};
const restart=()=>sqlite.prepare('UPDATE institutional_codes SET sent_at=sent_at-60').run();
try {
  for(const wrong of ['x@gmail.com','x@slsu.edu.ph.invalid','x@y@slsu.edu.ph','x@sub.slsu.edu.ph']) {
    await assert.rejects(startCode('signup',wrong,details,mail),/institutional email/);
    await assert.rejects(startCode('reset',wrong,{},mail),/institutional email/);
    await assert.rejects(passwordLogin(wrong,password),/institutional email/);
  }
  const send=()=>startCode('signup',' Reader@SLSU.EDU.PH ',details,mail);
  let {flow}=await send();
  await assert.rejects(passwordLogin(email,password),/incorrect/);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM users WHERE email=?').get(email).n,0);
  await assert.rejects(send(),/60 seconds/);
  const wrong=code==='000000'?'111111':'000000';
  for(let i=0;i<5;i++)await assert.rejects(verifyCode('signup',email,flow,wrong),/incorrect/);
  await assert.rejects(verifyCode('signup',email,flow,code),/incorrect/);
  restart();({flow}=await send());
  sqlite.exec('UPDATE institutional_codes SET expires_at=0');
  await assert.rejects(verifyCode('signup',email,flow,code),/expired/);
  ({flow}=await send());
  // Concurrent redemptions of one code can activate only one account.
  const tries=await Promise.allSettled([verifyCode('signup',email,flow,code),verifyCode('signup',email,flow,code)]);
  assert.equal(tries.filter(r=>r.status==='fulfilled').length,1);
  assert.notEqual(sqlite.prepare('SELECT password_hash FROM users WHERE email=?').get(email).password_hash,password);
  await assert.rejects(passwordLogin(email,'incorrect password'),/incorrect/);
  const token=await passwordLogin(email,password);
  assert.equal((await sessionUser(token)).role,'public');
  const unknown=await startCode('reset','unknown@slsu.edu.ph',{},()=>{throw Error('Unexpected delivery');});
  const reset=await startCode('reset',email,{},mail);
  assert.equal(unknown.message,reset.message);
  await assert.rejects(startCode('reset',email,{},mail),/60 seconds/);
  const {proof}=await verifyCode('reset',email,reset.flow,code);
  await assert.rejects(verifyCode('reset',email,reset.flow,code),/incorrect/);
  await resetPassword(email,reset.flow,proof,'replacement password');
  await assert.rejects(resetPassword(email,reset.flow,proof,password),/expired/);
  assert.equal(await sessionUser(token),null);
  await assert.rejects(passwordLogin(email,password),/incorrect/);
  const fresh=await passwordLogin(email,'replacement password');
  sqlite.prepare("UPDATE users SET role='admin' WHERE email=?").run(email);
  assert.equal((await sessionUser(fresh)).role,'admin');
  sqlite.prepare("UPDATE users SET email='reader@gmail.com' WHERE email=?").run(email);
  assert.equal(await sessionUser(fresh),null);
  const legacy='former@slsu.edu.ph';
  sqlite.prepare("INSERT INTO users(id,email,name,role,password_hash,password_salt,created_at) VALUES('legacy',?,'Former admin','admin','','',0)").run(legacy.toUpperCase());
  await assert.rejects(passwordLogin(legacy,password),/incorrect/);
  const migration=await startCode('signup',legacy,details,async (_,value)=>{code=value;});
  await verifyCode('signup',legacy,migration.flow,code);
  const migrated=await sessionUser(await passwordLogin(legacy,password));
  assert.equal(migrated.id,'legacy');
  assert.equal(migrated.role,'admin');
  console.log('Passed sign-up, domain checks, all code limits, password sign-in, reset, session revocation and administrator access.');
}finally{
  sqlite.close();for(const suffix of ['','-wal','-shm'])try{unlinkSync(process.env.DATABASE_PATH+suffix);}catch{}
}
