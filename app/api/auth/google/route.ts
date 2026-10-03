import { NextRequest, NextResponse } from 'next/server';
import { createSession, randomHex, sameOrigin, safeReturnTo, rateLimited, SESSION_COOKIE, SESSION_SECONDS } from '@/lib/auth';
import { verifyGoogleToken, saveGoogleUser } from '@/lib/google-auth';
import {clientIp} from '@/lib/client-ip.mjs';

const nonceCookie='kuta_google_nonce';
const headers={'Cache-Control':'no-store'};
export async function GET(request:NextRequest) {
  if(!process.env.GOOGLE_CLIENT_ID)return NextResponse.json({error:'Google sign-in is not configured yet.'},{status:503,headers});
  const nonce=randomHex();
  const response=NextResponse.json({clientId:process.env.GOOGLE_CLIENT_ID,nonce},{headers});
  response.cookies.set(nonceCookie,nonce,{httpOnly:true,sameSite:'strict',secure:request.nextUrl.protocol==='https:',path:'/',maxAge:600});
  return response;
}
export async function POST(request:NextRequest) {
  const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers});
  if(!sameOrigin(request))return reply('Please sign in from this site.',403);
  try {
    if(!process.env.GOOGLE_CLIENT_ID)return reply('Google sign-in is not configured yet.',503);
    if(await rateLimited(`google:${clientIp(request)}`,30))return reply('Too many attempts. Please try again in 15 minutes.',429);
    const body=await request.json() as Record<string,unknown>|null;
    const nonce=request.cookies.get(nonceCookie)?.value;
    if(!nonce || !body || typeof body.credential!=='string' || body.credential.length>12000)return reply('Please refresh this page and try Google sign-in again.',400);
    let profile;
    try{profile=await verifyGoogleToken(body.credential,nonce);}
    catch{return reply('Google sign-in could not be verified. Please check your connection and try again.',401);}
    const id=await saveGoogleUser(profile);
    if(!id)return reply('An account already uses this email. Please log in with its password.',409);
    const token=await createSession(id);
    const response=NextResponse.json({redirectTo:safeReturnTo(body.return_to)},{headers});
    response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:'/',maxAge:SESSION_SECONDS});
    response.cookies.delete(nonceCookie);
    return response;
  }catch(error){return reply(error instanceof SyntaxError?'Invalid sign-in request. Please try again.':'Unable to sign in right now. Please try again.',error instanceof SyntaxError?400:503);}
}
