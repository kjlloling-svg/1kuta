import {database} from './archive';
import {paperInput} from './record-validation';
import {writePaper} from './paper-write';
export {paperInput} from './record-validation';
export type {PaperInput} from './record-validation';
export {slugify} from './paper-write';
export async function readBoundedJson(request:Request,limit=150000){
 if(Number(request.headers.get('content-length')||0)>limit)throw new Error('Record exceeds the allowed request size');
 const reader=request.body?.getReader();if(!reader)throw new SyntaxError('Missing body');
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw new Error('Record exceeds the allowed request size');}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function readPaperInput(request:Request){return paperInput.parse(await readBoundedJson(request));}
export async function savePaper(input:import('./record-validation').PaperInput,existingId?:number){return writePaper(database(),input,existingId);}
