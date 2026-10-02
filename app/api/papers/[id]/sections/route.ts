import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getProtectedSections } from '@/lib/archive';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
 if(!await requireAdmin())return json({error:'Administrator access required'},403);
 const row=await getProtectedSections((await params).id);
 if(!row)return json({error:'Record not found'},404);
 return json({full_text:row.full_text});
 }catch(e){return fail(e);}
}
