import { env } from '@/lib/local-env';
import { NextRequest,NextResponse } from 'next/server';
import { constantTimeEqual,getCurrentUser,rateLimited,sameOrigin } from '@/lib/auth';
import { database } from '@/lib/archive';
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return new Response('Invalid request origin',{status:403});
  const user=await getCurrentUser();
  if(!user)return NextResponse.redirect(new URL('/login?return_to=%2Fadmin%2Fsetup',request.url),303);
  const error=(reason:string)=>NextResponse.redirect(new URL(`/admin/setup?error=${reason}`,request.url),303);
  try{
    if(await rateLimited(`admin-setup:${user.id}`,5))return error('slow');
    const secret=env.ARCHIVE_ADMIN_SETUP_TOKEN;
    if(!secret||secret.length<32)return error('unavailable');
    const data=await request.formData();
    if(!constantTimeEqual(String(data.get('token')||''),secret))return error('invalid');
    const existing=await database().prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
    if(existing)return error('claimed');
    const result=await database().prepare("UPDATE users SET role='admin' WHERE id=? AND NOT EXISTS (SELECT 1 FROM users WHERE role='admin')").bind(user.id).run();
    return result.meta.changes?NextResponse.redirect(new URL('/admin',request.url),303):error('claimed');
  }catch(e){console.error('Admin setup failure',e);return error('unavailable');}
}

