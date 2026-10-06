import {getCurrentUser,rateLimited} from './auth';
import {database} from './archive';
import {json} from './api';
export async function favoriteAccess(mutation=false){
 const user=await getCurrentUser();
 if(!user)return {denied:json({error:'Sign in to use Favorites'},401)};
 if(user.role!=='public')return {denied:json({error:'Favorites are available to public readers'},403)};
 if(await rateLimited(`favorites:${mutation?'write':'read'}:${user.id}`,mutation?30:120,60))return {denied:json({error:'Please wait a minute before trying again'},429)};
 return {user};
}
export async function favoriteList(userId:string,page:number){
 const db=database();
 const count=await db.prepare("SELECT COUNT(*) n FROM bookmarks b JOIN research_papers p ON p.id=b.paper_id WHERE b.user_id=? AND p.status='verified'").bind(userId).first<{n:number}>();
 const total=Number(count?.n||0),pages=Math.max(1,Math.ceil(total/20)),current=Math.min(page,pages);
 const rows=await db.prepare(`SELECT p.id,p.slug,p.title,p.year,COALESCE(g.name,'Uncategorized') program,g.slug program_slug,b.created_at saved_at,
 (SELECT group_concat(a.name,', ') FROM research_paper_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.paper_id=p.id) authors
 FROM bookmarks b JOIN research_papers p ON p.id=b.paper_id LEFT JOIN programs g ON g.id=p.program_id
 WHERE b.user_id=? AND p.status='verified' ORDER BY b.created_at DESC,b.paper_id DESC LIMIT 20 OFFSET ?`).bind(userId,(current-1)*20).all<{id:number;slug:string;title:string;year:number;program:string;program_slug:string|null;saved_at:number|null;authors:string|null}>();
 return {papers:rows.results,total,page:current,pages};
}
