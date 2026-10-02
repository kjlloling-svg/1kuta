import { getCurrentUser } from '@/lib/auth';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await getCurrentUser();return user?json({authenticated:true,user,role:user.role}):json({error:'Not logged in',authenticated:false},401);}catch(e){return fail(e);}}
