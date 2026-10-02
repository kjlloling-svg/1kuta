import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSession, findUser, normalizeEmail, rateLimited, safeReturnTo, sameOrigin, validEmail, SESSION_COOKIE, SESSION_SECONDS } from '@/lib/auth';
const dummyHash=bcrypt.hash('unavailable-account',12);
export async function POST(request:NextRequest){
 const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
 if(!sameOrigin(request))return reply('Invalid request origin',403);
 try{
 const body=await request.json();
 if(!body||typeof body!=='object'||Array.isArray(body))return reply('Check the submitted fields',400);
 const data=body as Record<string,unknown>;
 if(typeof data.identifier!=='string'||typeof data.password!=='string'||(data.remember!==undefined&&typeof data.remember!=='boolean'))return reply('Check the submitted fields',400);
 const identifier=normalizeEmail(data.identifier),password=data.password;
 if(!identifier||identifier.length>254||(identifier.includes('@')?!validEmail(identifier):! /^[a-z0-9._-]{3,64}$/.test(identifier))||!password||password.length>128)return reply('Enter a valid email or username and password',400);
 if(await rateLimited(`login-ip:${request.headers.get('x-kuta-client-ip')||'local'}`,30)||await rateLimited(`login:${identifier}`,8))return reply('Too many attempts. Please wait 15 minutes and try again.',429);
 const user=await findUser(identifier);
 const hash=user?.password_hash||await dummyHash;
 const matches=await bcrypt.compare(password,hash);
 if(!user||!matches)return reply('Incorrect email or password',401);
 const seconds=data.remember?SESSION_SECONDS:60*60*12;
 const token=await createSession(user.id,seconds);
 const requested=typeof data.return_to==='string'?data.return_to:null;
 const redirectTo=requested?safeReturnTo(requested):user.role==='admin'?'/admin':'/';
 const response=NextResponse.json({user:{id:user.id,email:user.email,name:user.name||user.email,role:user.role},redirectTo},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'lax',path:'/',...(data.remember?{maxAge:seconds}:{})});
 return response;
 }catch(e){if(e instanceof SyntaxError)return reply('Invalid request body',400);console.error('Login failure',e);return reply('Unable to log in. Please try again.',503);}
}


