import { stats } from '@/lib/archive';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){try{return json(await stats());}catch(e){return fail(e);}}
