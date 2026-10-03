import {spawn} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {setTimeout as pause} from 'node:timers/promises';

// Exercise the production Next server against synthetic, isolated local data.
process.env.DATABASE_PATH=`.sync/runtime-test-${randomUUID()}/fixture.sqlite`;
process.env.SESSION_SECRET=randomBytes(48).toString('hex');
process.env.GOOGLE_CLIENT_ID='fixture.apps.googleusercontent.com';
process.env.VERCEL='';process.env.TURSO_DATABASE_URL='';process.env.TURSO_AUTH_TOKEN='';process.env.BLOB_READ_WRITE_TOKEN='';
const {sqlite}=await import('./local-database.mjs');
for(const slug of ['bs-information-technology','bs-business-administration','bs-industrial-technology','bachelor-elementary-education'])sqlite.prepare('INSERT INTO programs(slug,name) VALUES (?,?)').run(slug,slug);
sqlite.close();
const socket=createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
process.env.PORT=String(port);
const env={...process.env,NODE_ENV:'production'};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',chunk=>{log+=chunk;});server.stderr.on('data',chunk=>{log+=chunk;});
async function run(script){
 const child=spawn(process.execPath,[script],{env,windowsHide:true,stdio:'inherit'});
 const [code]=await once(child,'exit');if(code!==0)throw new Error(script+' failed');
}
try{
 let ready=false;
 for(let attempt=0;attempt<60;attempt++){
  if(server.exitCode!==null)throw new Error('Production server stopped: '+log);
  try{if((await fetch(`http://localhost:${port}/login`)).ok){ready=true;break;}}catch{}
  await pause(500);
 }
 if(!ready)throw new Error('Production server did not start: '+log);
 await run('scripts/test-local-auth.mjs');
 await run('scripts/test-archive.mjs');
 await run('scripts/test-google-auth.mjs');
 console.log('PASS: production Next runtime, login, sessions, page refresh, archive permissions, PDF upload/download and Google token verification');
}finally{server.kill();await once(server,'exit').catch(()=>{});}
