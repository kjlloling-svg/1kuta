import {existsSync,writeFileSync,appendFileSync} from 'node:fs';
import {randomBytes,randomUUID} from 'node:crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
if(!existsSync('.env'))writeFileSync('.env',`SESSION_SECRET=${randomBytes(48).toString('hex')}\nPORT=3000\nDATABASE_PATH=data/kuta.sqlite\n`);
dotenv.config({quiet:true});
if(!process.env.SESSION_SECRET){appendFileSync('.env',`\nSESSION_SECRET=${randomBytes(48).toString('hex')}\n`);dotenv.config({override:true,quiet:true});}
const {sqlite}=await import('./local-database.mjs');
for(const [email,username,name,role] of [['admin@kuta.local','demo-admin','Demo Administrator','admin'],['public@kuta.local','demo-public','Demo Reader','public']]){
 const existing=sqlite.prepare('SELECT id FROM users WHERE email=?').get(email);
 if(existing){console.log(`DEMO account ${email} already exists; password preserved.`);continue;}
 const password=randomBytes(15).toString('base64url');
 sqlite.prepare('INSERT INTO users (id,email,username,name,role,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(),email,username,name,role,await bcrypt.hash(password,12),'',Math.floor(Date.now()/1000));
 console.log(`DEMO ACCOUNT — CHANGE BEFORE REAL USE\nRole: ${role}\nEmail: ${email}\nUsername: ${username}\nPassword: ${password}\n`);
}
