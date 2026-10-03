import {DatabaseSync,backup} from 'node:sqlite';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import dotenv from 'dotenv';
import {createClient} from '@libsql/client/web';
import {inspectSnapshot,assertEmptyTarget,transferFiles,transferDatabase} from './hosting-import.mjs';

process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const apply=process.argv.includes('--apply');
dotenv.config({path:'.env.vercel.local',quiet:true});
const local=existsSync('.env')?dotenv.parse(readFileSync('.env')):{};
const sourcePath=path.resolve(local.DATABASE_PATH||'data/kuta.sqlite');
if(!sourcePath.startsWith(process.cwd()+path.sep))throw new Error('Local source database must remain inside this project.');
let source,snapshot,client;
let stage='checking configuration';
try{
 if(apply){
  if(!/^(libsql|https):\/\//.test(process.env.TURSO_DATABASE_URL||'')||!process.env.TURSO_AUTH_TOKEN||!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('Configure TURSO_DATABASE_URL, TURSO_AUTH_TOKEN and BLOB_READ_WRITE_TOKEN in .env.vercel.local first.');
  client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
  stage='connecting to Turso';
  await assertEmptyTarget(client);
 }
 stage='checking local backup and PDFs';
 const directory=path.join('data','hosting-backups',new Date().toISOString().replaceAll(':','-')+'-'+randomUUID());
 mkdirSync(directory,{recursive:true});
 source=new DatabaseSync(sourcePath,{readOnly:true});
 const snapshotPath=path.join(directory,'snapshot.sqlite');
 await backup(source,snapshotPath);source.close();source=undefined;
 snapshot=new DatabaseSync(snapshotPath,{readOnly:true});
 const plan=inspectSnapshot(snapshot,path.resolve('data/uploads'));
 writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({counts:plan.counts,files:plan.files.map(({key,sha256,bytes})=>({key,sha256,size:bytes.length}))},null,2));
 console.log('Consistent local backup saved under '+directory);
 console.log('Rows by table: '+JSON.stringify(plan.counts));console.log('Verified PDFs: '+plan.files.length);
 if(!apply){console.log('CHECK ONLY: no hosted data was written. Stop local edits, then run with --apply when ready.');}
 else{
  stage='copying PDFs to Vercel Blob';
  await transferFiles(plan.files,process.env.BLOB_READ_WRITE_TOKEN);
  stage='importing the Turso database';
  const counts=await transferDatabase(snapshot,client,plan);
  console.log('Transfer complete; PDF checksums, row counts, and relationships verified.');
  console.log('Hosted row counts: '+JSON.stringify(counts));
  console.log('Original local data is unchanged. Sign in again on the hosted site.');
 }
}catch(error){
 // SQL/SDK errors can include request details; never print credentials or rows.
 const causes=[error,error?.cause,error?.cause?.cause];
 const messages=causes.map(cause=>cause?.message||'').join(' ');
 let advice='Check the database/store connection and local files.';
 if(causes.some(cause=>cause?.code==='ENOTFOUND'))advice='Server address could not be found. Check TURSO_DATABASE_URL against the Database URL in Turso, and check your internet connection.';
 else if(/unauthorized|access denied|forbidden|invalid.*token|token.*invalid|expired|\b401\b|\b403\b/i.test(messages))advice=stage.includes('Blob')?'Blob authentication failed. Check BLOB_READ_WRITE_TOKEN in .env.vercel.local; use the current read/write token for your private store.':'Turso authentication failed. Check TURSO_AUTH_TOKEN in .env.vercel.local; use a current token for this database.';
 else if(/fetch failed|network|timeout|ECONNREFUSED|ETIMEDOUT/i.test(messages))advice='The service could not be reached. Check your internet connection and service availability.';
 const known=/^(Configure|Target database|The local|Apply the|Local database|A stored|A PDF|An existing|Hosted PDF|Database row|Hosted database|BLOB_)/.test(error.message);
 console.error('Transfer stopped while '+stage+'. '+(known?error.message:advice)+' No local data was changed.');
 process.exitCode=1;
}finally{source?.close();snapshot?.close();client?.close();}
