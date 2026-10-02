import 'dotenv/config';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {randomUUID,randomBytes} from 'node:crypto';
import {sqlite} from './local-database.mjs';
const base=`http://localhost:${process.env.PORT||3000}`;
const password=randomBytes(20).toString('hex'),id=randomUUID(),email=`test-${id}@kuta.local`,publicId=randomUUID();
sqlite.prepare('INSERT INTO users (id,email,name,role,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?,?)').run(id,email,'Test Administrator','admin',await bcrypt.hash(password,12),'',Date.now()/1000);
sqlite.prepare('INSERT INTO users (id,email,name,role,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?,?)').run(publicId,`public-${email}`,'Test Reader','public',await bcrypt.hash(password,12),'',Date.now()/1000);
let cookie='';
async function request(url,body){return fetch(base+url,{method:body?'POST':'GET',headers:{Origin:base,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual'});}
async function check(label,run){await run();console.log(`PASS: ${label}`);}
try{
 await check('Logged-out me returns 401',async()=>assert.equal((await request('/api/auth/me')).status,401));
 await check('Protected admin redirects to Login',async()=>{const r=await request('/admin');assert.equal(r.status,307);assert.match(r.headers.get('location'),/login/);});
 await check('Empty fields rejected',async()=>assert.equal((await request('/api/auth/login',{identifier:'',password:''})).status,400));
 await check('Malformed email rejected',async()=>assert.equal((await request('/api/auth/login',{identifier:'bad@',password})).status,400));
 await check('Wrong password has generic error',async()=>{const r=await request('/api/auth/login',{identifier:email,password:'wrong'});assert.equal(r.status,401);assert.equal((await r.json()).error,'Incorrect email or password');});
 await check('Unknown user has same generic error',async()=>{const r=await request('/api/auth/login',{identifier:`unknown-${email}`,password});assert.equal(r.status,401);assert.equal((await r.json()).error,'Incorrect email or password');});
 await check('Correct admin login and Remember me cookie',async()=>{const r=await request('/api/auth/login',{identifier:email,password,remember:true});assert.equal(r.status,200);assert.equal((await r.json()).redirectTo,'/admin');const set=r.headers.get('set-cookie');assert.match(set,/HttpOnly/i);assert.match(set,/SameSite=lax/i);assert.match(set,/Max-Age=1209600/i);cookie=set.split(';')[0];});
 await check('Session persists across repeated page requests',async()=>{for(let i=0;i<2;i++){const r=await request('/api/auth/me');assert.equal(r.status,200);assert.equal((await r.json()).user.name,'Test Administrator');}const r=await request('/');assert.equal(r.status,200);const html=await r.text();assert.match(html,/Welcome to KUTA/);assert.match(html,/Test Administrator/);assert.match(html,/Log out/);});
 await check('Admin dashboard opens',async()=>assert.equal((await request('/admin')).status,200));
 await check('Logout revokes session',async()=>{const r=await fetch(base+'/api/auth/logout',{method:'POST',headers:{Origin:base,Cookie:cookie},redirect:'manual'});assert.equal(r.status,303);assert.equal((await request('/api/auth/me')).status,401);});
 cookie='';
 await check('Public login goes home and lacks admin access',async()=>{const r=await request('/api/auth/login',{identifier:`public-${email}`,password,remember:false});assert.equal(r.status,200);assert.equal((await r.json()).redirectTo,'/');assert.doesNotMatch(r.headers.get('set-cookie'),/Max-Age/i);cookie=r.headers.get('set-cookie').split(';')[0];const page=await request('/admin');assert.match(await page.text(),/Administrator access required/);});
 await check('Passwords stored as bcrypt hashes',async()=>{const row=sqlite.prepare('SELECT password_hash FROM users WHERE id=?').get(id);assert.match(row.password_hash,/^\$2[aby]\$/);assert.notEqual(row.password_hash,password);});
 cookie='';
 await check('Cross-origin login rejected',async()=>assert.equal((await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:'http://untrusted.invalid','Content-Type':'application/json'},body:JSON.stringify({identifier:email,password})})).status,403));
 await check('Login rate limiter returns 429',async()=>{let status;for(let i=0;i<9;i++)status=(await request('/api/auth/login',{identifier:`limited-${email}`,password:'wrong'})).status;assert.equal(status,429);});
}finally{sqlite.prepare('DELETE FROM sessions WHERE user_id IN (?,?)').run(id,publicId);sqlite.prepare('DELETE FROM users WHERE id IN (?,?)').run(id,publicId);}
