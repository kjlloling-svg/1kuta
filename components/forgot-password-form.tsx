'use client';
import {useEffect,useRef,useState} from 'react';
import Link from '@/components/native-link';
export function ForgotPasswordForm(){
 const [step,setStep]=useState<'email'|'code'|'password'|'done'>('email'),[email,setEmail]=useState(''),[ticket,setTicket]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[cooldown,setCooldown]=useState(0);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();},[step]);
 useEffect(()=>{if(!cooldown)return;const timer=window.setTimeout(()=>setCooldown(value=>Math.max(0,value-1)),1000);return()=>window.clearTimeout(timer);},[cooldown]);
 useEffect(()=>{if(step!=='done')return;const timer=window.setTimeout(()=>window.location.assign('/login'),2500);return()=>window.clearTimeout(timer);},[step]);
 async function call(body:Record<string,unknown>){const response=await fetch('/api/auth/password-reset',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)});const data=await response.json() as {message?:string;ticket?:string;error?:string};if(!response.ok)throw new Error(data.error||'Unable to continue. Please try again.');return data;}
 async function requestCode(){await call({action:'request',email});setCooldown(60);setTicket('');setMessage('If this email exists, we sent a code.');setStep('code');}
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;const form=event.currentTarget,fields=new FormData(form);setBusy(true);setError('');setMessage('');
  try{
   if(step==='email')await requestCode();
   else if(step==='code'){const data=await call({action:'verify',email,code:String(fields.get('code')||'')});if(!data.ticket)throw new Error('Please request a new code.');setTicket(data.ticket);setStep('password');}
   else if(step==='password'){await call({action:'reset',email,ticket,password:fields.get('password'),confirm:fields.get('confirm')});form.reset();setTicket('');setMessage('Your password has been updated. Returning to login…');setStep('done');}
  }catch(e){setError(e instanceof Error?e.message:'Unable to connect. Please try again.');}finally{setBusy(false);}
 }
 async function resend(){if(busy||cooldown)return;setBusy(true);setError('');try{await requestCode();}catch(e){setError(e instanceof Error?e.message:'Unable to connect. Please try again.');}finally{setBusy(false);}}
 return <><h2 ref={heading} tabIndex={-1}>{step==='email'?'1. Enter your email':step==='code'?'2. Enter your code':step==='password'?'3. Choose a new password':'Password updated'}</h2><form onSubmit={submit} aria-busy={busy}>
 {step==='email'&&<><label htmlFor="reset-email">Email address</label><input id="reset-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy}/><p>Use the real email address on your account. Google users can also set a password here, or return to Google sign-in.</p></>}
 {step==='code'&&<><p>Check your inbox and spam folder. Use the newest code; it expires in 10 minutes.</p><label htmlFor="reset-code">Six-digit code</label><input id="reset-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy}/></>}
 {step==='password'&&<><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} disabled={busy}/><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={72} disabled={busy}/><p>Use at least 12 characters. For accented characters or emoji, the maximum may be fewer than 72 characters.</p></>}
 <div className="field-error" role="alert">{error}</div><div className="login-status" role="status" aria-live="polite">{message}</div>
 {step!=='done'&&<button className="button button-primary" type="submit" disabled={busy}>{busy?'Please wait…':step==='email'?'Send code':step==='code'?'Verify code':'Save new password'}</button>}</form>
 {step==='code'&&<p className="auth-foot"><button className="button" type="button" onClick={resend} disabled={busy||cooldown>0}>{cooldown>0?`Resend code in ${cooldown}s`:'Resend code'}</button></p>}
 {(step==='code'||step==='password')&&<p className="auth-foot"><button className="button" type="button" disabled={busy} onClick={()=>{setTicket('');setError('');setMessage('');setStep('email');}}>Start again</button></p>}
 <p className="auth-foot"><Link href="/login">Back to login</Link></p></>;
}
