'use client';
import {GoogleSignIn} from './google-sign-in';
import Link from '@/components/native-link';
export function LoginForm({returnTo}:{returnTo?:string}){
 return <><GoogleSignIn returnTo={returnTo}/><p className="auth-foot">New to the archive? <Link className="button button-outline" href={'/register?return_to='+encodeURIComponent(returnTo||'/')}>Create account</Link></p></>;
}
