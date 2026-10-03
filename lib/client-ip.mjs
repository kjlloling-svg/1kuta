export function clientIp(request){
 // Vercel supplies this header. Never trust the local wrapper's header there.
 const value=process.env.VERCEL?request.headers.get('x-vercel-forwarded-for'):request.headers.get('x-kuta-client-ip');
 return value?.split(',')[0].trim()||'local';
}
