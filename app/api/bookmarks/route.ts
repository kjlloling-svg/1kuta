import { NextRequest } from 'next/server';
import { getCurrentUser,sameOrigin } from '@/lib/auth';
import { database,getPaper } from '@/lib/archive';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){
  try{
    const user=await getCurrentUser();if(!user)return json({error:'Log in to sync bookmarks'},401);
    const rows=await database().prepare('SELECT p.slug FROM bookmarks b JOIN research_papers p ON p.id=b.paper_id WHERE b.user_id=? ORDER BY p.title').bind(user.id).all<{slug:string}>();
    return json({bookmarks:rows.results.map(r=>r.slug)});
  }catch(e){return fail(e);}
}
async function change(request:NextRequest,add:boolean){
  if(!sameOrigin(request))return json({error:'Invalid request origin'},403);
  try{
    const user=await getCurrentUser();if(!user)return json({error:'Log in to sync bookmarks'},401);
    const body=await request.json() as {paper_id?:string|number};
    const paper=await getPaper(String(body.paper_id||''));if(!paper)return json({error:'Record not found'},404);
    if(add)await database().prepare('INSERT OR IGNORE INTO bookmarks (user_id,paper_id) VALUES (?,?)').bind(user.id,paper.id).run();
    else await database().prepare('DELETE FROM bookmarks WHERE user_id=? AND paper_id=?').bind(user.id,paper.id).run();
    return json({bookmarked:add});
  }catch(e){return fail(e);}
}
export async function POST(request:NextRequest){return change(request,true);}
export async function DELETE(request:NextRequest){return change(request,false);}
