import { NextRequest, NextResponse } from 'next/server';
import { clearSession, sameOrigin, SESSION_COOKIE } from '@/lib/auth';
export async function POST(request:NextRequest) {
 if(!sameOrigin(request))return new Response('Invalid request origin',{status:403});
 try { await clearSession(); } catch(e) { console.error('Logout failure',e);return new Response('Unable to sign out. Please try again.',{status:503}); }
 const response=NextResponse.redirect(new URL('/',request.url),303);
 response.cookies.delete(SESSION_COOKIE);
 return response;
}
