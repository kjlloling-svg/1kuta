import {runtimeDatabase as db} from './runtime-database.mjs';
import {digest} from './school-session.mjs';
export async function limited(key,limit,windowSeconds=900){
 const now=Math.floor(Date.now()/1000);
 const row=await db.prepare(`INSERT INTO login_attempts (key,count,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET
 count=CASE WHEN excluded.window_start-login_attempts.window_start>=? THEN 1 ELSE MIN(login_attempts.count+1,?) END,
 window_start=CASE WHEN excluded.window_start-login_attempts.window_start>=? THEN excluded.window_start ELSE login_attempts.window_start END RETURNING count`)
 .bind(digest(key),now,windowSeconds,limit+1,windowSeconds).first();
 return !row||row.count>limit;
}
