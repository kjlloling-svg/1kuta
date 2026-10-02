import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin, sameOrigin } from './auth';
export const noStore={'Cache-Control':'no-store','Vary':'Cookie'};
export function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:noStore});}
export function fail(error:unknown){
  if(error instanceof ZodError)return json({error:'Check the submitted fields',details:error.issues.map(i=>({field:i.path.join('.'),message:i.message}))},400);
  if(error instanceof SyntaxError)return json({error:'Invalid JSON body'},400);
  if(error instanceof Error && /^(Select a valid program|Record exceeds)/.test(error.message))return json({error:error.message},400);
  console.error('Archive API failure',error);
  return json({error:'Archive temporarily unavailable'},503);
}
export async function adminMutation(request:Request){
  if(!sameOrigin(request))return json({error:'Invalid request origin'},403);
  if(!await requireAdmin())return json({error:'Admin access required'},403);
  return null;
}
