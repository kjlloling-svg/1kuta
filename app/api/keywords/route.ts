import {getCurrentUser} from '@/lib/auth';
import { allKeywords } from '@/lib/archive';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){try{if(!await getCurrentUser())return json({error:"Please sign in with Google."},401);return json({keywords:await allKeywords()});}catch(e){return fail(e);}}
