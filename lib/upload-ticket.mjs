import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {validFileKey} from './paper-storage.mjs';
export const MAX_PDF_BYTES=10*1024*1024;
function signature(payload){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error('Session secret missing');return createHmac('sha256',secret).update('paper-upload:'+payload).digest();}
export function createUploadTicket(paperId,userId,name,size){
 if(!Number.isSafeInteger(paperId)||paperId<1||typeof name!=='string'||name.length>255||!name.toLowerCase().endsWith('.pdf')||!Number.isSafeInteger(size)||size<5||size>MAX_PDF_BYTES)throw new Error('Invalid PDF upload');
 const data={paperId,userId,name,size,key:`papers/${paperId}/${randomUUID()}.pdf`,expires:Date.now()+15*60*1000};
 const payload=Buffer.from(JSON.stringify(data)).toString('base64url');
 return {ticket:payload+'.'+signature(payload).toString('base64url'),key:data.key};
}
export function verifyUploadTicket(ticket,paperId,userId){
 if(typeof ticket!=='string'||ticket.length>4096)throw new Error('Invalid upload ticket');
 const parts=ticket.split('.');if(parts.length!==2)throw new Error('Invalid upload ticket');
 const expected=signature(parts[0]),actual=Buffer.from(parts[1],'base64url');
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new Error('Invalid upload ticket');
 const data=JSON.parse(Buffer.from(parts[0],'base64url').toString());
 if(data.paperId!==paperId||data.userId!==userId||data.expires<Date.now()||!validFileKey(data.key)||!data.key.startsWith(`papers/${paperId}/`))throw new Error('Expired or invalid upload ticket');
 return data;
}
export async function hasPdfSignature(stream){
 const reader=stream.getReader();const prefix=[];
 try{while(prefix.length<5){const {done,value}=await reader.read();if(done)break;prefix.push(...value.slice(0,5-prefix.length));}return Buffer.from(prefix).toString()==='%PDF-';}
 finally{await reader.cancel();}
}
