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
 const {prepareAccounts,schoolEmail}=await import('../lib/institutional-schema.mjs');
 const email=schoolEmail(await input.question('Verified institutional email to make an administrator: '));
 if(!email)throw new Error('Enter an @slsu.edu.ph address.');
 await prepareAccounts();
 const {runtimeDatabase:db}=await import('../lib/runtime-database.mjs');
 const result=await db.prepare("UPDATE users SET role='admin' WHERE email=? AND id IN (SELECT user_id FROM institutional_accounts)").bind(email).run();
 if(result.meta.changes!==1){console.error('No verified account found. Complete sign-up on the same site first.');process.exitCode=1;}
 else console.log('Administrator access granted. Refresh KUTA and open /admin.');
}catch{console.error('Check the institutional email and the private database settings.');process.exitCode=1;}
finally{input.close();}
