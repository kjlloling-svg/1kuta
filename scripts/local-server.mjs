import 'dotenv/config';
import express from 'express';
import next from 'next';
if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error('Run npm run seed first to create .env and the demo account');
const port=Number(process.env.PORT||3000);
const app=next({dev:true,hostname:'localhost',port});
await app.prepare();
const server=express();
server.disable('x-powered-by');
// Next's development renderer otherwise replaces page headers with no-cache.
// Keep session-dependent HTML/RSC/API responses out of browser/shared caches.
server.use((req,res,next)=>{
 if(!/^\/(?:_next\/|assets\/|favicon\.svg)/.test(req.path)){
  const setHeader=res.setHeader.bind(res);
  res.setHeader=(name,value)=>{
   if(name.toLowerCase()==='cache-control')value='private, no-store';
   if(name.toLowerCase()==='vary'){const values=String(value).split(',').map(v=>v.trim());if(!values.some(v=>v.toLowerCase()==='cookie'))values.push('Cookie');value=values.join(', ');}
   return setHeader(name,value);
  };
  res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');
 }
 next();
});
server.use((req,res,next)=>{req.headers['x-kuta-client-ip']=req.socket.remoteAddress||'local';res.setHeader('X-Content-Type-Options','nosniff');next();});
server.use((req,res)=>app.getRequestHandler()(req,res));
server.listen(port,'localhost',()=>console.log(`KUTA is ready at http://localhost:${port}`));

