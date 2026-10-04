import {NextRequest} from 'next/server';
import {getCurrentUser} from '@/lib/auth';
import {getPaper,getPaperAuthors} from '@/lib/archive';
import {toCitationDTO} from '@/lib/archive-dto';
import {citation,citationParts,citationStyles,citationHasUncertainNames,type CitationStyle} from '@/lib/citations';
import {json,fail,authRequired} from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  const user=await getCurrentUser();if(!user)return authRequired(request);
  const paper=await getPaper((await params).id,user.role);if(!paper)return json({error:'Record not found'},404);
  const style=request.nextUrl.searchParams.get('style')||'apa';if(!citationStyles.some(([key])=>key===style))return json({error:'Choose an available citation format'},400);
  const reference=Number(request.nextUrl.searchParams.get('number')||1);if(!Number.isInteger(reference)||reference<1||reference>9999)return json({error:'Reference number must be between 1 and 9999'},400);
  const record=toCitationDTO(paper,await getPaperAuthors(paper.id),user.role);
  return json({uncertainNames:citationHasUncertainNames(record.authors),parts:citationParts(record,style as CitationStyle,reference),text:citation(record,style as CitationStyle,reference)});
 }catch(error){return fail(error);}
}
