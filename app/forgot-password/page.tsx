import {AccountForm} from '@/components/account-form';
import {safeReturnTo} from '@/lib/auth';
export default async function ForgotPassword({searchParams}:{searchParams:Promise<{return_to?:string}>}){
  const params=await searchParams;
  return <main id="main" className="auth-page"><div className="auth-card"><h1>Reset your password</h1><AccountForm mode="reset" returnTo={safeReturnTo(params.return_to)}/></div></main>;
}
