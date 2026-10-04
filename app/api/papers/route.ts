import { NextRequest } from 'next/server';
import { ensurePrograms, publicPaper, searchPapers } from '@/lib/archive';
import { adminMutation, fail, json } from '@/lib/api';
import { readPaperInput, savePaper } from '@/lib/paper-input';
import { getCurrentUser } from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
  try{
    const s=request.nextUrl.searchParams;
    const year=Number(s.get('year')),page=Number(s.get('page'));
    const user=await getCurrentUser();
    const access=user?.role||'guest';
    const result=await searchPapers({q:s.get('q')||'',author:s.get('author')||'',program:s.get('program')||'',year:Number.isInteger(year)&&year>=2009&&year<=2026?year:undefined,keyword:s.get('keyword')||'',page:Number.isInteger(page)?page:1,sort:s.get('sort')||'',access});
    return json({...result,papers:await Promise.all(result.papers.map(p=>publicPaper(p,access)))});
  }catch(e){return fail(e);}
}
export async function POST(request:NextRequest){
  const denied=await adminMutation(request);if(denied)return denied;
  try{await ensurePrograms();const input=await readPaperInput(request);const id=await savePaper(input);return json({id},201);}
  catch(e){return fail(e);}
}

