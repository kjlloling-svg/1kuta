import { env } from '@/lib/local-env';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { database } from '@/lib/archive';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    if(!await requireAdmin())return json({error:'Administrator access required'},403);
    const id=(await params).id;
    const row=await database().prepare("SELECT file_key,file_name FROM research_papers WHERE (slug=? OR CAST(id AS TEXT)=?)").bind(id,id).first<{file_key:string|null;file_name:string|null}>();
    if(!row?.file_key)return json({error:'No downloadable PDF is attached'},404);
    if(!env.BUCKET)return json({error:'File storage unavailable'},503);
    const object=await env.BUCKET.get(row.file_key);
    if(!object)return json({error:'File unavailable'},404);
    const name=(row.file_name||'research-paper.pdf').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,120);
    return new Response(object.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':`${_request.nextUrl.searchParams.get('inline')==='1'?'inline':'attachment'}; filename="${name}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch(e){return fail(e);}
}



