import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {get,head,put,BlobNotFoundError} from '@vercel/blob';
import {validFileKey} from '../lib/paper-storage.mjs';

const quote=name=>'"'+name.replaceAll('"','""')+'"';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function inspectSnapshot(source,uploads){
 const schema=source.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type DESC,name").all();
 const tables=schema.filter(row=>row.type==='table');
 for(const table of ['users','research_papers','programs','authors','research_paper_authors','bookmarks','sessions','login_attempts']){
  if(!tables.some(row=>row.name===table))throw new Error('The local database is not initialized.');
 }
 for(const [table,required] of [['users',['name','username','google_sub','picture']],['research_papers',['full_text','keywords','file_key']]]){
  const columns=source.prepare(`PRAGMA table_info(${quote(table)})`).all().map(row=>row.name);
  if(required.some(name=>!columns.includes(name)))throw new Error('Apply the existing local migrations before preparing the transfer.');
 }
 if(source.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Local database has invalid relationships; transfer stopped.');
 const files=source.prepare('SELECT id,file_key,file_size FROM research_papers WHERE file_key IS NOT NULL').all().map(row=>{
  if(!validFileKey(row.file_key))throw new Error('A stored PDF path needs review before transfer.');
  const bytes=readFileSync(path.join(uploads,row.file_key));
  if(bytes.subarray(0,5).toString()!=='%PDF-'||bytes.length!==row.file_size)throw new Error('A PDF is missing, invalid, or differs from its stored size.');
  return {key:row.file_key,bytes,sha256:digest(bytes)};
 });
 const counts=Object.fromEntries(tables.map(row=>[row.name,source.prepare(`SELECT COUNT(*) AS n FROM ${quote(row.name)}`).get().n]));
 return {schema,tables,files,counts};
}
export async function assertEmptyTarget(client){
 const result=await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
 if(result.rows.length)throw new Error('Target database is not empty. Nothing was overwritten.');
}
export async function transferFiles(files,token){
 if(!token)throw new Error('BLOB_READ_WRITE_TOKEN is required.');
 for(const file of files){
  let existing;
  try{existing=await head(file.key,{token});}catch(error){if(!(error instanceof BlobNotFoundError))throw error;}
  if(existing){
   const object=await get(file.key,{access:'private',useCache:false,token});
   if(!object||object.statusCode!==200||digest(Buffer.from(await new Response(object.stream).arrayBuffer()))!==file.sha256)throw new Error('An existing hosted PDF differs; no file was overwritten.');
  }else{
   await put(file.key,file.bytes,{access:'private',contentType:'application/pdf',addRandomSuffix:false,allowOverwrite:false,token});
   const object=await get(file.key,{access:'private',useCache:false,token});
   if(!object||object.statusCode!==200||digest(Buffer.from(await new Response(object.stream).arrayBuffer()))!==file.sha256)throw new Error('Hosted PDF verification failed.');
  }
 }
}
export async function transferDatabase(source,client,snapshot){
 const tx=await client.transaction('write');
 try{
  // Recheck inside the write transaction so another importer cannot overwrite it.
  await assertEmptyTarget(tx);
  await tx.execute('PRAGMA defer_foreign_keys=ON');
  for(const item of snapshot.schema)await tx.execute(item.sql);
  const expected={...snapshot.counts};
  for(const table of snapshot.tables){
   // Cookies from localhost should not become production sessions.
   if(['sessions','login_attempts'].includes(table.name)){expected[table.name]=0;continue;}
   const rows=source.prepare(`SELECT * FROM ${quote(table.name)}`).all();
   for(let offset=0;offset<rows.length;offset+=100){
    const batch=rows.slice(offset,offset+100).map(row=>{const columns=Object.keys(row);return {sql:`INSERT INTO ${quote(table.name)} (${columns.map(quote).join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,args:columns.map(name=>row[name])};});
    await tx.batch(batch);
   }
  }
  // Preserve AUTOINCREMENT high-water marks, including previously deleted rows.
  if(source.prepare("SELECT name FROM sqlite_master WHERE name='sqlite_sequence'").get()){
   for(const row of source.prepare('SELECT name,seq FROM sqlite_sequence').all()){
    await tx.execute({sql:'DELETE FROM sqlite_sequence WHERE name=?',args:[row.name]});
    await tx.execute({sql:'INSERT INTO sqlite_sequence(name,seq) VALUES (?,?)',args:[row.name,row.seq]});
   }
  }
  for(const [name,count] of Object.entries(expected)){
   const result=await tx.execute(`SELECT COUNT(*) AS n FROM ${quote(name)}`);
   if(Number(result.rows[0].n)!==count)throw new Error('Database row-count verification failed.');
  }
  if((await tx.execute('PRAGMA foreign_key_check')).rows.length)throw new Error('Hosted database relationship check failed.');
  await tx.commit();return expected;
 }catch(error){await tx.rollback();throw error;}finally{tx.close();}
}
