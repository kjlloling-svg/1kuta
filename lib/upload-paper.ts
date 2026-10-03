// Browser uploads directly to private storage; only small JSON messages reach Next.
export async function uploadPaper(id:number,file:File){
 const endpoint=`/api/papers/${id}/upload`;
 const post=(body:unknown)=>fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const prepared=await post({action:'prepare',name:file.name,size:file.size});
 const config=await prepared.json() as {mode:'blob';key:string;ticket:string;error?:string}|{mode:'local';error?:string};if(!prepared.ok)throw new Error(config.error||'PDF upload failed');
 let response:Response;
 if(config.mode==='blob'){
  const {upload}=await import('@vercel/blob/client');
  await upload(config.key,file,{access:'private',contentType:'application/pdf',handleUploadUrl:`${endpoint}/token`,clientPayload:config.ticket});
  response=await post({action:'complete',ticket:config.ticket});
 }else{
  const body=new FormData();body.set('file',file);response=await fetch(endpoint,{method:'POST',body});
 }
 const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||'PDF upload failed');
}
