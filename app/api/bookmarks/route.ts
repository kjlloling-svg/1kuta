import {NextRequest} from 'next/server';
import {z} from 'zod';
import {sameOrigin} from '@/lib/auth';
import {database} from '@/lib/archive';
import {favoriteAccess} from '@/lib/favorites';
import {fail,json} from '@/lib/api';
export const dynamic='force-dynamic';
const input=z.object({paper_id:z.union([z.number().int().positive().safe(),z.string().trim().min(1).max(220)])}).strict();
export async function GET(){
 try{
  const access=await favoriteAccess();if(access.denied)return access.denied;
  const rows=await database().prepare("SELECT p.slug FROM bookmarks b JOIN research_papers p ON p.id=b.paper_id WHERE b.user_id=? AND p.status='verified' ORDER BY p.title").bind(access.user.id).all<{slug:string}>();
  return json({bookmarks:rows.results.map(r=>r.slug)});
 }catch(error){return fail(error);}
}
async function change(request:NextRequest,add:boolean){
 if(!sameOrigin(request))return json({error:'Invalid request origin'},403);
 try{
  const access=await favoriteAccess(true);if(access.denied)return access.denied;
  const body=await request.text();if(body.length>2048)return json({error:'Request is too large'},413);
  const id=String(input.parse(JSON.parse(body)).paper_id),db=database();
  if(add){
   const paper=await db.prepare("SELECT id FROM research_papers WHERE (slug=? OR CAST(id AS TEXT)=?) AND status='verified'").bind(id,id).first<{id:number}>();
   if(!paper)return json({error:'Only verified papers can be saved'},404);
   await db.prepare("INSERT OR IGNORE INTO bookmarks(user_id,paper_id,created_at) SELECT ?,id,? FROM research_papers WHERE id=? AND status='verified'").bind(access.user.id,Date.now(),paper.id).run();
  }else{
   await db.prepare('DELETE FROM bookmarks WHERE user_id=? AND paper_id IN (SELECT id FROM research_papers WHERE slug=? OR CAST(id AS TEXT)=?)').bind(access.user.id,id,id).run();
  }
  return json({bookmarked:add});
 }catch(error){return fail(error);}
}
export async function POST(request:NextRequest){return change(request,true);}
export async function DELETE(request:NextRequest){return change(request,false);}
