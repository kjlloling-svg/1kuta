import {after,NextResponse} from 'next/server';
import {sameOrigin} from '@/lib/auth';
import {clientIp} from '@/lib/client-ip.mjs';
import {env} from '@/lib/local-env';
import {createPasswordResetService,ResetError,RESET_MESSAGE} from '@/lib/password-reset.mjs';
import {gmailConfigured,sendResetCode} from '@/lib/gmail-reset.mjs';
export const runtime='nodejs';
export const maxDuration=60;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({error:'Please use the password-reset form on this site.'},403);
 try{
  const raw=await request.text();if(raw.length>4096)return reply({error:'The submitted form is too large.'},413);
  const body=JSON.parse(raw) as Record<string,unknown>|null;
  if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Check the submitted fields.'},400);
  const service=createPasswordResetService({db:env.DB,secret:process.env.PASSWORD_RESET_SECRET});
  const ip=clientIp(request);
  if(body.action==='request'){
   if(!gmailConfigured())return reply({error:'Password reset is temporarily unavailable. Please try again later.'},503);
   const delivery=await service.request(body.email,ip);
   // Vercel keeps this serverless work alive after the identical public response.
   // No queue, persistent process, plaintext OTP storage, or detached promise.
   after(async()=>{try{await service.deliver(delivery,sendResetCode);}catch{console.error('Password reset delivery failed. Check Gmail configuration and sending limits.');}});
   return reply({message:RESET_MESSAGE});
  }
  if(body.action==='verify')return reply({ticket:await service.verify(body.email,body.code,ip)});
  if(body.action==='reset'){
   await service.reset(body.email,body.ticket,body.password,body.confirm,ip);
   return reply({message:'Your password has been updated. Please log in with your new password.'});
  }
  return reply({error:'Invalid password-reset action.'},400);
 }catch(error){
  if(error instanceof ResetError)return reply({error:error.message},error.status);
  if(error instanceof SyntaxError)return reply({error:'Check the submitted form.'},400);
  console.error('Password reset unavailable. Check database and server configuration.');
  return reply({error:'Password reset is temporarily unavailable. Please try again later.'},503);
 }
}
