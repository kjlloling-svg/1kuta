import { allKeywords } from '@/lib/archive';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(){try{return json({keywords:await allKeywords()});}catch(e){return fail(e);}}
