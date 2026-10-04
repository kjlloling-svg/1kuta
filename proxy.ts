import {NextRequest,NextResponse} from 'next/server';
import {sessionUser,SESSION_COOKIE} from './lib/google-session.mjs';
const publicPaths=new Set(['/login','/register','/api/auth/google','/api/auth/logout','/api/auth/me','/favicon.ico','/favicon.svg','/file.svg','/window.svg','/globe.svg']);
export async function proxy(request:NextRequest){
 const path=request.nextUrl.pathname;
 if(publicPaths.has(path)||path.startsWith('/_next/static/')||path.startsWith('/_next/image')||path.startsWith('/assets/'))return NextResponse.next();
 try{
  if(await sessionUser(request.cookies.get(SESSION_COOKIE)?.value)){
   const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store');return response;
  }
 }catch{return NextResponse.json({error:'Unable to check your session. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
 if(path.startsWith('/api/'))return NextResponse.json({error:'Please sign in with Google.'},{status:401,headers:{'Cache-Control':'no-store'}});
 const target=new URL('/login',request.url);target.searchParams.set('return_to',path+request.nextUrl.search);
 if(request.cookies.has(SESSION_COOKIE)||request.cookies.has('slsu_archive_session'))target.searchParams.set('reason','session_expired');
 const response=NextResponse.redirect(target);response.headers.set('Cache-Control','no-store');response.cookies.delete(SESSION_COOKIE);response.cookies.delete('slsu_archive_session');return response;
}
export const config={matcher:['/:path*']};
