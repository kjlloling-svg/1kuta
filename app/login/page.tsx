import type { Metadata } from 'next';
import { getCurrentUser, safeReturnTo } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Log In'};
export default async function Login({searchParams}:{searchParams:Promise<{return_to?:string;reason?:string}>}){
 const s=await searchParams,user=await getCurrentUser();
 if(user)redirect(s.return_to?safeReturnTo(s.return_to):user.role==='admin'?'/admin':'/');
 return <main id="main" className="auth-page"><div className="auth-card"><p className="eyebrow">WELCOME TO KUTA</p><h1>Log in</h1><p>Knowledge &amp; Universal Technology Archive</p>{s.reason==='session_expired'&&<p role="status">Your session expired. Please sign in again.</p>}<LoginForm returnTo={s.return_to?safeReturnTo(s.return_to):undefined}/></div></main>;
}
