import { NextRequest } from 'next/server';
import { env } from '@/lib/local-env';
import { database, getPaper, publicPaper } from '@/lib/archive';
import { adminMutation, fail, json } from '@/lib/api';
import { readPaperInput, savePaper } from '@/lib/paper-input';
import { getCurrentUser } from '@/lib/auth';
export const dynamic='force-dynamic';
type C={params:Promise<{id:string}>};
export async function GET(request:NextRequest,{params}:C){
  try{
    const access=(await getCurrentUser())?.role||'guest',admin=access==='admin';
    const paper=await getPaper((await params).id,access);
    if(!paper)return json({error:'Record not found'},404);
    const result=await publicPaper(paper,access);
    if(!admin)return json(result);
    const privateRow=await database().prepare('SELECT full_text,program_id FROM research_papers WHERE id=?').bind(paper.id).first<{full_text:string|null;program_id:number}>();
    return json({...result,full_text:privateRow?.full_text==null?null:String(privateRow.full_text),program_id:Number(privateRow?.program_id)});
  }
  catch(e){return fail(e);}
}
export async function PUT(request:NextRequest,{params}:C){
  const denied=await adminMutation(request);if(denied)return denied;
  try{
    const paper=await getPaper((await params).id,'admin');if(!paper)return json({error:'Record not found'},404);
    const input=await readPaperInput(request);await savePaper(input,paper.id);return json({id:paper.id});
  }catch(e){return fail(e);}
}
export async function DELETE(request:NextRequest,{params}:C){
  const denied=await adminMutation(request);if(denied)return denied;
  try{
    const paper=await getPaper((await params).id,'admin');if(!paper)return json({error:'Record not found'},404);
    const db=database();
    const file=await db.prepare('SELECT file_key FROM research_papers WHERE id=?').bind(paper.id).first<{file_key:string|null}>();
    await db.batch([db.prepare('DELETE FROM bookmarks WHERE paper_id=?').bind(paper.id),db.prepare('DELETE FROM research_paper_authors WHERE paper_id=?').bind(paper.id),db.prepare('DELETE FROM research_papers WHERE id=?').bind(paper.id)]);
    if(file?.file_key && env.BUCKET)await env.BUCKET.delete(file.file_key);
    return json({deleted:true});
  }catch(e){return fail(e);}
}



