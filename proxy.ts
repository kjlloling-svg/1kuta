import {NextRequest,NextResponse} from 'next/server';
import {sessionUser,SESSION_COOKIE} from './lib/google-session.mjs';
import {limited} from './lib/google-challenge.mjs';
import {clientIp} from './lib/client-ip.mjs';
const authPaths=new Set(['/api/auth/google','/api/auth/logout','/api/auth/me']);
export async function proxy(request:NextRequest){
 const path=request.nextUrl.pathname;
 if(authPaths.has(path)||(path.startsWith('/_next/static/')||path==='/_next/image')||path.startsWith('/assets/')||['/favicon.ico','/favicon.svg','/file.svg','/window.svg','/globe.svg'].includes(path))return NextResponse.next();
 try{
  const user=await sessionUser(request.cookies.get(SESSION_COOKIE)?.value);
  if(!user&&path!=='/login'&&path!=='/register'){
   // Counters live in Turso/SQLite, so parallel serverless instances share the limit.
   if(await limited('public-browse:'+clientIp(request),120,60)){
    console.info(JSON.stringify({event:'public_access_denied',timestamp:new Date().toISOString(),ip:clientIp(request),endpoint:path,reason:'rate_limited'}));
    return NextResponse.json({error:'Too many requests. Please wait a minute.',type:'rate_limited'},{status:429,headers:{'Cache-Control':'no-store','Retry-After':'60'}});
   }
   const publicApi=request.method==='GET'&&(/^\/api\/(?:papers(?:\/[^/]+)?|programs|keywords|stats)$/.test(path)||/^\/api\/papers\/[^/]+\/citation$/.test(path)||/^\/api\/research-papers\/[^/]+\/abstract$/.test(path));
   // Abstract/citation endpoints enforce their own required 403 response and audit log.
   if(path.startsWith('/api/')&&!publicApi)return NextResponse.json({error:'Please sign in with Google.'},{status:401,headers:{'Cache-Control':'no-store'}});
   if(path==='/admin'||path.startsWith('/admin/')){
    const target=new URL('/login',request.url);target.searchParams.set('return_to',path+request.nextUrl.search);
    if(request.cookies.has(SESSION_COOKIE))target.searchParams.set('reason','session_expired');
    const response=NextResponse.redirect(target);response.headers.set('Cache-Control','no-store');return response;
   }
  }
  const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store');return response;
 }catch{return NextResponse.json({error:'Unable to load the archive. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export const config={matcher:['/:path*']};
