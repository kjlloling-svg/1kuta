import { allPrograms } from '@/lib/archive';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){try{return json({programs:await allPrograms()});}catch(e){return fail(e);}}
