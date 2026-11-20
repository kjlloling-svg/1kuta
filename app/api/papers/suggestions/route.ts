import {type NextRequest} from 'next/server';
import {fail,json} from '@/lib/api';
import {suggestPaperSearches} from '@/lib/archive';
import {getCurrentUser} from '@/lib/auth';

export async function GET(request:NextRequest){
  const query=request.nextUrl.searchParams.get('q')?.trim();
  if(!query)return json({suggestions:[]});
  try{
    const user=await getCurrentUser();
    return json({suggestions:await suggestPaperSearches(query,user?.role)});
  }catch(error){
    return fail(error);
  }
}
