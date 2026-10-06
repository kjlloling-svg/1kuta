import {NextRequest} from 'next/server';
import {favoriteAccess,favoriteList} from '@/lib/favorites';
import {json,fail} from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 try{
  const access=await favoriteAccess();if(access.denied)return access.denied;
  const value=request.nextUrl.searchParams.get('page')||'1';
  if(!/^\d{1,5}$/.test(value)||Number(value)<1)return json({error:'Invalid page'},400);
  return json(await favoriteList(access.user.id,Number(value)));
 }catch(error){return fail(error);}
}
