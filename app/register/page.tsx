import type { Metadata } from 'next';
import Link from '@/components/native-link';
import { getCurrentUser, safeReturnTo } from '@/lib/auth';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Create an Account'};
export default async function Register({searchParams}:{searchParams:Promise<{return_to?:string;error?:string}>}){
 const s=await searchParams,returnTo=safeReturnTo(s.return_to);
 if(await getCurrentUser())redirect(returnTo);
 const message=s.error==='slow'?'Too many attempts. Please wait 15 minutes and try again.':s.error==='unavailable'?'We couldn’t create this account. Check the details or try again later.':s.error==='email'?'Enter a valid email address.':s.error==='password'?'Use a password between 12 and 128 characters.':s.error==='confirm'?'The passwords do not match.':s.error?'Check your details and try again.':'';
 return <main id="main" className="auth-page"><div className="auth-card"><p className="eyebrow">RESEARCH ACCESS</p><h1>Create an account</h1><p>An account lets you view research abstracts. Registration does not verify SLSU affiliation.</p>{message&&<p className="form-error" id="register-error" role="alert">{message}</p>}<form method="post" action="/api/auth/register"><input type="hidden" name="return_to" value={returnTo}/><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={s.error==='email'} aria-describedby={s.error==='email'?'register-error':undefined}/><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-invalid={s.error==='password'} aria-describedby={s.error==='password'?'register-error':undefined}/><small>Use at least 12 characters.</small><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-invalid={s.error==='confirm'} aria-describedby={s.error==='confirm'?'register-error':undefined}/><button className="button button-primary" type="submit">Create account</button></form><p className="auth-foot">Already registered? <Link href={`/login?return_to=${encodeURIComponent(returnTo)}`}>Log in</Link></p></div></main>;
}
