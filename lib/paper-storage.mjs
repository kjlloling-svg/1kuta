import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {get,put,del} from '@vercel/blob';

export const usesBlobStorage=()=>Boolean(process.env.VERCEL||process.env.TURSO_DATABASE_URL||process.env.BLOB_READ_WRITE_TOKEN);
export function validFileKey(key){return typeof key==='string'&&/^papers\/[0-9]+\/[a-zA-Z0-9_-]+\.pdf$/.test(key);}
function checked(key){if(!validFileKey(key))throw new Error('Invalid file key');return key;}
function file(key){return path.join(process.cwd(),'data','uploads',checked(key));}
function token(){if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('Configure BLOB_READ_WRITE_TOKEN for private PDF storage.');return process.env.BLOB_READ_WRITE_TOKEN;}
export const paperStorage={
 async put(key,bytes){
  checked(key);
  if(usesBlobStorage())return put(key,bytes,{access:'private',contentType:'application/pdf',addRandomSuffix:false,allowOverwrite:false,token:token()});
  const p=file(key);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,Buffer.from(bytes));
 },
 async get(key){
  checked(key);
  if(usesBlobStorage()){
   const object=await get(key,{access:'private',useCache:false,token:token()});
   return object?.statusCode===200?{body:object.stream}:null;
  }
  try{return {body:new Uint8Array(await readFile(file(key)))};}catch(error){if(error.code==='ENOENT')return null;throw error;}
 },
 async delete(key){
  checked(key);
  if(usesBlobStorage())return del(key,{token:token()});
  await unlink(file(key)).catch(error=>{if(error.code!=='ENOENT')throw error;});
 }
};
