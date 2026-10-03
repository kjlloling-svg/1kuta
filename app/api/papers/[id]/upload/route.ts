import { env } from '@/lib/local-env';
import { NextRequest } from 'next/server';
import { adminMutation,fail,json } from '@/lib/api';
import { database,getPaper } from '@/lib/archive';
import {requireAdmin} from '@/lib/auth';
import {usesBlobStorage} from '@/lib/paper-storage.mjs';
import {createUploadTicket,verifyUploadTicket,hasPdfSignature} from '@/lib/upload-ticket.mjs';
import {head,get} from '@vercel/blob';
export const runtime='nodejs';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const denied=await adminMutation(request);if(denied)return denied;
  try{
    if(Number(request.headers.get('content-length')||0)>11*1024*1024)return json({error:'PDF files must be 10 MB or smaller'},413);
    const paper=await getPaper((await params).id,'admin');if(!paper)return json({error:'Record not found'},404);
    if(!env.BUCKET)return json({error:'File storage unavailable'},503);
    if(request.headers.get('content-type')?.includes('application/json')){
      const body=await request.json() as Record<string,unknown>|null,user=await requireAdmin();if(!user)return json({error:'Administrator access required'},403);
      if(!body)return json({error:'Invalid upload request'},400);
      if(body.action==='prepare'){
        if(!usesBlobStorage())return json({mode:'local'});
        if(!process.env.BLOB_READ_WRITE_TOKEN)return json({error:'Private PDF storage is not configured'},503);
        try{return json({mode:'blob',...createUploadTicket(paper.id,user.id,body.name,body.size)});}catch{return json({error:'PDF files must be 10 MB or smaller'},400);}
      }
      if(body.action!=='complete'||!usesBlobStorage())return json({error:'Invalid upload request'},400);
      let ticket;try{ticket=verifyUploadTicket(body.ticket,paper.id,user.id);}catch{return json({error:'Upload expired or invalid. Retry the upload.'},400);}
      const metadata=await head(ticket.key);
      if(metadata.pathname!==ticket.key||metadata.size!==ticket.size||metadata.contentType!=='application/pdf')return json({error:'Invalid PDF upload'},400);
      const object=await get(ticket.key,{access:'private',useCache:false});
      if(!object||object.statusCode!==200||!await hasPdfSignature(object.stream)){
        await env.BUCKET.delete(ticket.key);return json({error:'Invalid PDF file'},400);
      }
      const db=database(),old=await db.prepare('SELECT file_key FROM research_papers WHERE id=?').bind(paper.id).first<{file_key:string|null}>();
      if(!old)return json({error:'Record no longer exists'},404);
      const changed=await db.prepare('UPDATE research_papers SET file_key=?,file_name=?,file_size=?,updated_at=? WHERE id=? AND file_key IS ?').bind(ticket.key,ticket.name,ticket.size,new Date().toISOString(),paper.id,old.file_key).run();
      if(!changed.meta.changes)return json({error:'The attachment changed. Reload the record and retry.'},409);
      if(old.file_key&&old.file_key!==ticket.key)await env.BUCKET.delete(old.file_key);
      return json({uploaded:true,file_name:ticket.name});
    }
    if(usesBlobStorage())return json({error:'Use the direct PDF upload flow'},400);
    const data=await request.formData(),file=data.get('file');
    if(!(file instanceof File))return json({error:'Choose a PDF file'},400);
    if(file.type!=='application/pdf'||!file.name.toLowerCase().endsWith('.pdf')||file.size<5||file.size>10*1024*1024)return json({error:'PDF files must be 10 MB or smaller'},400);
    const bytes=await file.arrayBuffer();
    if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return json({error:'Invalid PDF file'},400);
    const db=database(),old=await db.prepare('SELECT file_key FROM research_papers WHERE id=?').bind(paper.id).first<{file_key:string|null}>();
    const key=`papers/${paper.id}/${crypto.randomUUID()}.pdf`;
    await env.BUCKET.put(key,bytes);
    try{await db.prepare('UPDATE research_papers SET file_key=?,file_name=?,file_size=?,updated_at=? WHERE id=?').bind(key,file.name,file.size,new Date().toISOString(),paper.id).run();}
    catch(e){await env.BUCKET.delete(key);throw e;}
    if(old?.file_key)await env.BUCKET.delete(old.file_key);
    return json({uploaded:true,file_name:file.name});
  }catch(e){return fail(e);}
}

