import {z} from 'zod';
import {adminMutation,fail,json} from '@/lib/api';
import {database} from '@/lib/archive';
import {readBoundedJson} from '@/lib/paper-input';
import {DuplicatePaperError,findDuplicate,writePaper} from '@/lib/paper-write';
import {IMPORT_CHUNK_SIZE,importInput,issueMessage,duplicateKey,type ProgramOption,type ImportResult} from '@/lib/record-validation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const inputSchema=z.object({action:z.enum(['preview','import']),rows:z.array(z.object({row:z.number().int().min(2).max(501),values:z.record(z.string(),z.string().max(20000)),error:z.string().max(1000).optional()}).strict()).min(1).max(IMPORT_CHUNK_SIZE)}).strict();
export async function POST(request:Request){
 const denied=await adminMutation(request);if(denied)return denied;
 try{
  const {action,rows}=inputSchema.parse(await readBoundedJson(request,2_000_000));
  const db=database(),programs=(await db.prepare('SELECT id,slug,name,major FROM programs').all<ProgramOption>()).results;
  const results:ImportResult[]=[],seen=new Set<string>();
  for(const row of rows){
   let input;
   try{input=importInput(row,programs);}catch(error){results.push({row:row.row,title:row.values.title||'',outcome:'skipped',message:issueMessage(error)});continue;}
   const key=duplicateKey(input.title,input.year,input.program_id);
   if(seen.has(key)){results.push({row:row.row,title:input.title,outcome:'skipped',message:'Duplicate title, year, and program in this file.'});continue;}
   seen.add(key);
   try{
    if(action==='preview'){
     if(await findDuplicate(db,input))throw new DuplicatePaperError();
     results.push({row:row.row,title:input.title,outcome:'valid',message:'Ready to import'});
    }else{const id=await writePaper(db,input);results.push({row:row.row,title:input.title,outcome:'added',message:'Added successfully',id});}
   }catch(error){
    if(error instanceof DuplicatePaperError)results.push({row:row.row,title:input.title,outcome:'skipped',message:error.message});
    else {console.error('Record import failed',row.row,error);results.push({row:row.row,title:input.title,outcome:'failed',message:'Could not save. You can safely retry the file; existing records will be skipped.'});}
   }
  }
  return json({results});
 }catch(error){return fail(error);}
}
