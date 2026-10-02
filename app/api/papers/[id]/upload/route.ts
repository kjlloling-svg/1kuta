import { env } from '@/lib/local-env';
import { NextRequest } from 'next/server';
import { adminMutation,fail,json } from '@/lib/api';
import { database,getPaper } from '@/lib/archive';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const denied=await adminMutation(request);if(denied)return denied;
  try{
    if(Number(request.headers.get('content-length')||0)>11*1024*1024)return json({error:'PDF files must be 10 MB or smaller'},413);
    const paper=await getPaper((await params).id,'admin');if(!paper)return json({error:'Record not found'},404);
    if(!env.BUCKET)return json({error:'File storage unavailable'},503);
    const data=await request.formData(),file=data.get('file');
    if(!(file instanceof File))return json({error:'Choose a PDF file'},400);
    if(file.type!=='application/pdf'||!file.name.toLowerCase().endsWith('.pdf')||file.size<5||file.size>10*1024*1024)return json({error:'PDF files must be 10 MB or smaller'},400);
    const bytes=await file.arrayBuffer();
    if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return json({error:'Invalid PDF file'},400);
    const db=database(),old=await db.prepare('SELECT file_key FROM research_papers WHERE id=?').bind(paper.id).first<{file_key:string|null}>();
    const key=`papers/${paper.id}/${crypto.randomUUID()}.pdf`;
    await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'application/pdf'}});
    try{await db.prepare('UPDATE research_papers SET file_key=?,file_name=?,file_size=?,updated_at=? WHERE id=?').bind(key,file.name,file.size,new Date().toISOString(),paper.id).run();}
    catch(e){await env.BUCKET.delete(key);throw e;}
    if(old?.file_key)await env.BUCKET.delete(old.file_key);
    return json({uploaded:true,file_name:file.name});
  }catch(e){return fail(e);}
}

