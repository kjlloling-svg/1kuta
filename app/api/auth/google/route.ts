import {NextRequest,NextResponse} from 'next/server';
import {createSession,sameOrigin,safeReturnTo,normalizeEmail,validEmail,SESSION_COOKIE,SESSION_SECONDS} from '@/lib/auth';
import {verifyGoogleToken,saveGoogleUser,hasGoogleUser} from '@/lib/google-auth';
import {beginChallenge,consumeChallenge,limited,audit} from '@/lib/google-challenge.mjs';
import {clientIp} from '@/lib/client-ip.mjs';
const nonceCookie='kuta_google_nonce',headers={'Cache-Control':'no-store'};
async function begin(request:NextRequest,email:string|null){
 const nonce=await beginChallenge(email);
 const response=NextResponse.json({clientId:process.env.GOOGLE_CLIENT_ID,nonce},{headers});
 response.cookies.set(nonceCookie,nonce,{httpOnly:true,sameSite:'strict',secure:request.nextUrl.protocol==='https:',path:'/',maxAge:600});
 audit('started',email?'create-account':'sign-in');return response;
}
export async function GET(request:NextRequest){
 try{
  if(!process.env.GOOGLE_CLIENT_ID)return NextResponse.json({error:'Google sign-in is not configured yet.'},{status:503,headers});
  if(await limited('google-start:'+clientIp(request),30)){audit('failed','ip-limit');return NextResponse.json({error:'Too many attempts. Please try again in 15 minutes.'},{status:429,headers});}
  return await begin(request,null);
 }catch{audit('failed','setup');return NextResponse.json({error:'Unable to connect. Please try again.'},{status:503,headers});}
}
export async function POST(request:NextRequest){
 const fail=(error:string,status:number,reason:string)=>{audit('failed',reason);return NextResponse.json({error},{status,headers});};
 if(!sameOrigin(request))return fail('Please sign in from this site.',403,'origin');
 try{
  if(!process.env.GOOGLE_CLIENT_ID)return fail('Google sign-in is not configured yet.',503,'configuration');
  if(await limited('google-post:'+clientIp(request),30))return fail('Too many attempts. Please try again in 15 minutes.',429,'ip-limit');
  const body=await request.json() as Record<string,unknown>|null;
  if(body?.action==='begin'){
   const email=typeof body.email==='string'?normalizeEmail(body.email):'';
   if(!validEmail(email))return fail('Enter a valid email address.',400,'email-format');
   if(await limited('google-create:'+email,5,3600))return fail('Too many requests for this email. Please try again in an hour.',429,'email-limit');
   return await begin(request,email);
  }
  const nonce=request.cookies.get(nonceCookie)?.value;
  if(!nonce||typeof body?.credential!=='string'||body.credential.length>12000)return fail('Refresh this page and try Google sign-in again.',400,'invalid-request');
  const challenge=await consumeChallenge(nonce);
  if(!challenge)return fail('This sign-in request expired. Please retry Google sign-in.',401,'nonce');
  let profile;
  try{profile=await verifyGoogleToken(body.credential,nonce);}catch{return fail('Google sign-in could not be verified. Please retry.',401,'token');}
  if(challenge.email&&normalizeEmail(profile.email!)!==challenge.email)return fail('Choose the Google account matching the email you entered.',400,'email-mismatch');
  if(!challenge.email&&!await hasGoogleUser(profile.sub)&&await limited('google-create:'+normalizeEmail(profile.email!),5,3600))return fail('Too many requests for this email. Please try again in an hour.',429,'email-limit');
  const id=await saveGoogleUser(profile);
  if(!id)return fail('This email belongs to a previous account. Contact the site owner to resolve access.',409,'legacy-collision');
  const seconds=Math.min(SESSION_SECONDS,profile.exp-Math.floor(Date.now()/1000));
  if(seconds<=0)return fail('Your Google sign-in expired. Please try again.',401,'expired');
  const token=await createSession(id,seconds);
  const response=NextResponse.json({redirectTo:safeReturnTo(body.return_to)},{headers});
  response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:'/',maxAge:seconds});
  response.cookies.delete(nonceCookie);response.cookies.delete('slsu_archive_session');
  audit('success','google-verified');return response;
 }catch(error){return fail('Something went wrong. Please try again.',error instanceof SyntaxError?400:503,'request');}
}
