import { NextRequest } from 'next/server';

import {getCurrentUser} from '@/lib/auth';
import {getPaper} from '@/lib/archive';
import {json,fail} from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(_request:NextRequest,{params}:{params:Promise<{slug:string}>}) {
 try {

  const user=await getCurrentUser();if(!user)return json({error:'Log in to read the abstract'},401);
  const paper=await getPaper((await params).slug,user.role);
  const record=paper?{abstract:paper.abstract}:null;
  if(!record)return json({error:'Record not found'},404);
  return json({abstract:record.abstract});
 }catch(e){return fail(e);}
}

