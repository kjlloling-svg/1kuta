import {NextRequest,NextResponse,after} from 'next/server';
import {sameOrigin, safeReturnTo, SESSION_COOKIE, SESSION_SECONDS, rateLimited} from '@/lib/auth';
import {clientIp} from '@/lib/client-ip.mjs';
import {programs} from '@/lib/programs';
import {FormError, requireEmail, startCode, verifyCode, resetPassword, passwordLogin} from '@/lib/institutional-auth.mjs';
import {sendCode} from '@/lib/mail-code.mjs';


const json = (body:unknown,status=200) => NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:NextRequest) {
  if (!sameOrigin(request)) return json({error:'Open the form on KUTA and try again.'},403);
  try {
    if (await rateLimited('school-auth:'+clientIp(request),90,900)) return json({error:'Too many requests. Try again in 15 minutes.'},429);
    const input = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return json({error:'Invalid form.'},400);
    const body = input as Record<string,unknown>;
    const email = requireEmail(body?.email);
    if (body.action==='login') {
      if (await rateLimited('school-login:'+email,20,900)) return json({error:'Too many sign-in attempts. Try again in 15 minutes.'},429);
      const token = await passwordLogin(email, body.password);
      const response = json({redirectTo:safeReturnTo(body.returnTo)});
      response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:'/',maxAge:SESSION_SECONDS});
      return response;
    }
    const purpose = body.purpose;
    if (purpose!=='reset' && purpose!=='signup') return json({error:'Unknown form.'},400);
    if (body.action==='send') {
      if (purpose==='signup' && (!programs.some(p=>p.slug===body.program) || typeof body.name!=='string'))
        return json({error:'Enter your name and choose a program from the list.'},400);
      if (purpose==='reset') {
        // Return before mail delivery for both known and unknown addresses.
        const result=await startCode(purpose,email,{},async (address:string,code:string,kind:string)=>{
          after(async ()=>{
            try { await sendCode(address,code,kind); }
            catch { console.error('KUTA reset email delivery failed.'); }
          });
        });
        return json(result);
      }
      return json(await startCode(purpose,email,{name:body.name,program:body.program,password:body.password}));
    }
    if (typeof body.flow!=='string' || !/^[a-f0-9]{64}$/.test(body.flow)) return json({error:'Request a new code.'},400);
    if (body.action==='verify' && typeof body.code==='string' && /^\d{6}$/.test(body.code))
      return json(await verifyCode(purpose,email,body.flow,body.code));
    if (purpose==='reset' && body.action==='change' && typeof body.proof==='string' && /^[a-f0-9]{64}$/.test(body.proof)) {
      await resetPassword(email,body.flow,body.proof,body.password);
      return json({message:'Password changed. Sign in with your new password.'});
    }
    return json({error:'Check the form and enter the six-digit code when requested.'},400);
  } catch (error) {
    if (error instanceof FormError) return json({error:error.message},400);
    if (error instanceof SyntaxError) return json({error:'Invalid form.'},400);
    return json({error:'KUTA could not complete this request. Please try again.'},503);
  }
}
