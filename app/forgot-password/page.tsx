import type {Metadata} from 'next';
import {ForgotPasswordForm} from '@/components/forgot-password-form';
export const metadata:Metadata={title:'Forgot password'};
export default function ForgotPassword(){
 return <main id="main" className="auth-page"><div className="auth-card"><p className="eyebrow">WELCOME TO KUTA</p><h1>Reset your password</h1><p>Verify your email to choose a new password.</p><ForgotPasswordForm/></div></main>;
}
