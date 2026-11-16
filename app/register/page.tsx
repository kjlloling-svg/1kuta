import type {Metadata} from 'next';

import {getCurrentUser,safeReturnTo} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {AccountForm} from '@/components/account-form';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Create an Account',robots:{index:false,follow:false}};
export default async function Register({searchParams}:{searchParams:Promise<{return_to?:string}>}){
 const s=await searchParams,returnTo=safeReturnTo(s.return_to);
 if(await getCurrentUser())redirect(returnTo);
 return <main id="main" className="auth-page"><div className="auth-card"><p className="eyebrow">RESEARCH ACCESS</p><h1>Create an account</h1><AccountForm mode="signup" returnTo={returnTo}/></div></main>;
}
