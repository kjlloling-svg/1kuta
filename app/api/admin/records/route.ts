import {NextRequest} from 'next/server';
import {getCurrentUser} from '@/lib/auth';
import {json,fail} from '@/lib/api';
import {adminRecords,reviewFilter} from '@/lib/admin-records';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 try{
  const user=await getCurrentUser();
  if(!user)return json({error:'Sign in required'},401);
  if(user.role!=='admin')return json({error:'Administrator access required'},403);
  return json(await adminRecords(reviewFilter(request.nextUrl.searchParams)));
 }catch(error){return fail(error);}
}
