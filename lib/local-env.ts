import { localDatabase } from '../scripts/local-database.mjs';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
function file(key:string){if(!/^[a-zA-Z0-9/_-]+\.pdf$/.test(key)||key.includes('..'))throw new Error('Invalid file key');return path.join(process.cwd(),'data','uploads',key);}
export const env={DB:localDatabase,ARCHIVE_ADMIN_SETUP_TOKEN:process.env.ARCHIVE_ADMIN_SETUP_TOKEN,BUCKET:{async put(key:string,bytes:ArrayBuffer,_options?:unknown){void _options;const p=file(key);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,Buffer.from(bytes));},async get(key:string){try{return {body:new Uint8Array(await readFile(file(key))) };}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}},async delete(key:string){await unlink(file(key)).catch(e=>{if(e.code!=='ENOENT')throw e;});}}};

