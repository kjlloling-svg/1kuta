import Link from '@/components/native-link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function AdminSetup({searchParams}:{searchParams:Promise<{error?:string}>}){
  const user=await getCurrentUser();if(!user)redirect('/login?return_to=%2Fadmin%2Fsetup');
  if(user.role==='admin')redirect('/admin');
  const error=(await searchParams).error;
  const message=error==='slow'?'Too many attempts. Try again in 15 minutes.':error==='claimed'?'An administrator has already been set up.':error==='unavailable'?'Admin setup is not configured. Ask the site owner to set the setup token.':error?'The setup token is invalid.':'';
  return <main id="main" className="auth-page"><div className="auth-card"><p className="eyebrow">ONE-TIME SETUP</p><h1>Administrator access</h1><p>Enter the owner’s setup token to enable the archive dashboard for your account.</p>{message&&<p className="form-error" role="alert">{message}</p>}<form method="post" action="/api/admin/setup"><label htmlFor="setup-token">Setup token</label><input id="setup-token" name="token" type="password" autoComplete="off" required minLength={32}/><button className="button button-primary" type="submit">Activate admin access</button></form><p className="auth-foot"><Link href="/research-papers">Return to the archive</Link></p></div></main>;
}
