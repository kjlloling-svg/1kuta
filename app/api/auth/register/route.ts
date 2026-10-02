import { NextRequest, NextResponse } from 'next/server';
import { createSession, normalizeEmail, rateLimited, registerUser, safeReturnTo, sameOrigin, validEmail, SESSION_COOKIE, SESSION_SECONDS } from '@/lib/auth';
export async function POST(request:NextRequest) {
 if(!sameOrigin(request))return new Response('Invalid request origin',{status:403});
 const data=await request.formData(), email=normalizeEmail(String(data.get('email')||'')), password=String(data.get('password')||''), confirm=String(data.get('confirm')||''), destination=safeReturnTo(String(data.get('return_to')||''));
 const error=(reason:string)=>NextResponse.redirect(new URL(`/register?return_to=${encodeURIComponent(destination)}&error=${reason}`,request.url),303);
 if(!validEmail(email))return error('email');
 if(password.length<12||password.length>128)return error('password');
 if(password!==confirm)return error('confirm');
 try {
  if(await rateLimited(`register:${email}`,5))return error('slow');
  const userId=await registerUser(email,password);
  const token=await createSession(userId);
  const response=NextResponse.redirect(new URL(destination,request.url),303);
  response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});
  return response;
 } catch(e) { console.error('Registration failure',e);return error('unavailable'); }
}
