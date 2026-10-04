import type {Metadata} from 'next';
import Link from '@/components/native-link';
import {getCurrentUser,safeReturnTo} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {GoogleCreateAccount} from '@/components/google-create-account';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Create an Account'};
export default async function Register({searchParams}:{searchParams:Promise<{return_to?:string}>}){
 const s=await searchParams,returnTo=safeReturnTo(s.return_to);
 if(await getCurrentUser())redirect(returnTo);
 return <main id="main" className="auth-page"><div className="auth-card"><p className="eyebrow">RESEARCH ACCESS</p><h1>Create an account</h1><p>Use your Google account to access the archive. Registration does not verify SLSU affiliation.</p><GoogleCreateAccount returnTo={returnTo}/><p className="auth-foot">Already registered? <Link href={'/login?return_to='+encodeURIComponent(returnTo)}>Sign in with Google</Link></p></div></main>;
}
