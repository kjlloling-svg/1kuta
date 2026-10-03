import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {requireAdmin,sameOrigin} from '@/lib/auth';
import {getPaper} from '@/lib/archive';
import {json} from '@/lib/api';
import {verifyUploadTicket,MAX_PDF_BYTES} from '@/lib/upload-ticket.mjs';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!sameOrigin(request))return json({error:'Invalid request origin'},403);
 const user=await requireAdmin();if(!user)return json({error:'Administrator access required'},403);
 try{
  const paper=await getPaper((await params).id,'admin');if(!paper)return json({error:'Record not found'},404);
  const body=await request.json() as HandleUploadBody;
  if(body.type!=='blob.generate-client-token')return json({error:'Invalid upload request'},400);
  const result=await handleUpload({request,body,onBeforeGenerateToken:async(pathname,clientPayload)=>{
   const ticket=verifyUploadTicket(clientPayload,paper.id,user.id);
   if(pathname!==ticket.key)throw new Error('Invalid upload path');
   return {allowedContentTypes:['application/pdf'],maximumSizeInBytes:Math.min(MAX_PDF_BYTES,ticket.size),validUntil:ticket.expires,addRandomSuffix:false,allowOverwrite:false};
  }});
  return json(result);
 }catch{return json({error:'Unable to authorize PDF upload. Check storage configuration or retry.'},400);}
}
