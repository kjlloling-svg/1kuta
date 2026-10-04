'use client';
import {useState} from 'react';
import {GoogleSignIn} from './google-sign-in';
import Link from '@/components/native-link';
export function LoginForm({returnTo}:{returnTo?:string}){
 const [show,setShow]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[toast,setToast]=useState(''),[errors,setErrors]=useState<{identifier?:string;password?:string}>({});
 async function submit(event:React.FormEvent<HTMLFormElement>){
 event.preventDefault();if(busy)return;
 const form=event.currentTarget,data=new FormData(form),identifier=String(data.get('identifier')||'').trim(),password=String(data.get('password')||'');
 const next:{identifier?:string;password?:string}={};
 if(!identifier)next.identifier='Enter your email or username.';
 else if(identifier.includes('@')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))next.identifier='Enter a valid email address.';
 else if(!identifier.includes('@')&&!/^[a-zA-Z0-9._-]{3,64}$/.test(identifier))next.identifier='Enter a valid username (3–64 letters, numbers, dots, underscores or hyphens).';
 if(!password)next.password='Enter your password.';
 setErrors(next);setMessage('');
 if(Object.keys(next).length){setToast('Please check the highlighted fields.');form.querySelector<HTMLInputElement>(next.identifier?'#identifier':'#password')?.focus();return;}
 setBusy(true);setToast('');
 try{
 const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({identifier,password,remember:data.get('remember')==='on',return_to:returnTo})});
 const result=await response.json() as {error?:string;redirectTo:string};
 if(!response.ok)throw new Error(result.error||'Unable to log in. Please try again.');
 try{const path=new URL(result.redirectTo,window.location.origin).pathname;if(path.startsWith('/research-papers/'))sessionStorage.setItem('kuta-unlocked-paper',decodeURIComponent(path.slice('/research-papers/'.length)));}catch{}
 setMessage('Login successful. Opening your page…');setToast('Welcome back! Login successful.');
 window.setTimeout(()=>window.location.assign(result.redirectTo),650);
 }catch(error){const text=error instanceof Error?error.message:'Unable to connect. Please try again.';setMessage(text);setToast(text);setBusy(false);}
 }
 return <><form onSubmit={submit} noValidate aria-busy={busy}><label htmlFor="identifier">Email or username</label><input id="identifier" name="identifier" autoComplete="username" required maxLength={254} aria-invalid={!!errors.identifier} aria-describedby="identifier-error"/><span id="identifier-error" className="field-error">{errors.identifier}</span><label htmlFor="password">Password</label><div className="password-field"><input id="password" name="password" type={show?'text':'password'} autoComplete="current-password" required maxLength={128} aria-invalid={!!errors.password} aria-describedby="password-error"/><button type="button" className="password-toggle" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'} aria-pressed={show}>{show?'Hide':'Show'}</button></div><span id="password-error" className="field-error">{errors.password}</span><label className="remember-option"><input type="checkbox" name="remember"/> Remember me for 14 days</label><div className="login-status" role="status" aria-live="polite" aria-atomic="true">{Object.values(errors).join(' ')||message}</div><button className="button button-primary" type="submit" disabled={busy}>{busy?'Logging in…':'Login'}</button></form><p className="auth-foot"><Link href="/forgot-password">Forgot password?</Link></p><GoogleSignIn returnTo={returnTo}/><p className="auth-foot">New to the archive? <Link href="/register">Create an account</Link></p>{toast&&<div className="auth-toast" role="status" aria-live="polite">{toast}</div>}</>;
}

