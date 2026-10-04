import dotenv from 'dotenv';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
// The private database credentials stay in this ignored file, never in arguments.
const local=process.argv.includes('--local');
dotenv.config({path:local?'.env':'.env.vercel.local',override:true,quiet:true});
if(local){delete process.env.TURSO_DATABASE_URL;delete process.env.TURSO_AUTH_TOKEN;delete process.env.VERCEL;}
else if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw new Error('Configure .env.vercel.local first.');
const input=createInterface({input:stdin,output:stdout});
try{
 const email=(await input.question('Email of the Google account you already signed in with: ')).trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
 const {runtimeDatabase:db}=await import('../lib/runtime-database.mjs');
 const user=await db.prepare("SELECT id,google_sub FROM users WHERE email=? AND google_sub IS NOT NULL AND google_sub<>''").bind(email).first();
 if(!user)throw new Error('Sign in to the site with this Google account first. No account was changed.');
 const result=await db.prepare("UPDATE users SET role='admin' WHERE id=? AND google_sub=?").bind(user.id,user.google_sub).run();
 if(result.meta.changes!==1)throw new Error('Account changed during promotion. Retry.');
 console.log('Administrator access granted. Refresh the website and open /admin.');
}catch{console.error('Could not grant access. Check the private database configuration and that this Google account has already signed in.');process.exitCode=1;}
finally{input.close();}
