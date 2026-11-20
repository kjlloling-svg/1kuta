'use client';
import {useEffect,useRef,useState,useSyncExternalStore,type FormEvent} from 'react';
import {programs} from '@/lib/programs';

type Mode='login'|'signup'|'reset';
const subscribeToForm = () => () => {};
const browserReady = () => true;
const serverReady = () => false;

export function AccountForm({mode,returnTo='/'}:{mode:Mode;returnTo?:string}) {
  const ready=useSyncExternalStore(subscribeToForm,browserReady,serverReady);
  const [step,setStep]=useState<'details'|'code'|'password'|'done'>('details');
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[program,setProgram]=useState('');
  const [code,setCode]=useState(''),[flow,setFlow]=useState(''),[proof,setProof]=useState('');
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[seconds,setSeconds]=useState(0);
  const nextField=useRef<HTMLInputElement>(null);
  const completion=useRef<HTMLParagraphElement>(null);
  const links='?return_to='+encodeURIComponent(returnTo);
  useEffect(()=>{
    if (step==='code'||step==='password') nextField.current?.focus();
    if (step==='done') completion.current?.focus();
  },[step]);
  useEffect(()=>{
    if (seconds<=0) return;
    const timer=setTimeout(()=>setSeconds(seconds-1),1000);
    return ()=>clearTimeout(timer);
  },[seconds]);
  async function submit(action:string) {
    if (busy) return;
    setBusy(true);setNotice('');
    try {
      const details=action==='login'||action==='change'?{password}:action==='send'&&mode==='signup'?{name,program,password}:{};
      const response=await fetch('/api/auth/account',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,purpose:mode,email,...details,flow,code,proof,returnTo})});
      const data=await response.json() as {error?:string;redirectTo?:string;flow?:string;proof?:string;message?:string};
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      if (action==='login') { window.location.assign(data.redirectTo || returnTo); return; }
      if (action==='send' && data.flow) {setFlow(data.flow);setStep('code');setCode('');setSeconds(60);}
      else if (data.proof) {setProof(data.proof);setCode('');setPassword('');setStep('password');}
      else {setPassword('');setProof('');setFlow('');setStep('done');}
      setNotice(data.message || '');
    } catch(error){setNotice(error instanceof Error?error.message:'Unable to connect. Please try again.');}
    finally{setBusy(false);}
  }
  function onSubmit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = event.currentTarget.querySelector('input:invalid, select:invalid');
    if (invalid instanceof HTMLInputElement || invalid instanceof HTMLSelectElement) {
      // Position the field before the browser opens its validation message.
      invalid.focus({preventScroll:true});
      invalid.scrollIntoView({block:'center'});
      invalid.reportValidity();
      return;
    }
    void submit(mode==='login'?'login':step==='code'?'verify':step==='password'?'change':'send');
  }
  return <>
    {step!=='done'&&<form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!ready}>
      {step==='details'&&<>
        {mode==='signup'&&<>
          <label htmlFor="full-name">Full name</label><input id="full-name" autoComplete="name" required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/>
          <label htmlFor="program">Program</label><select id="program" required value={program} onChange={e=>setProgram(e.target.value)}><option value="">Select your program</option>{programs.map(p=><option key={p.slug} value={p.slug}>{p.label}</option>)}</select>
        </>}
        <label htmlFor="email">Institutional email</label><input id="email" type="email" autoComplete="username" placeholder="username@slsu.edu.ph" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/>
      </>}
      {(step==='password'||(step==='details'&&mode!=='reset'))&&<>
        <label htmlFor="password">{step==='password'?'New password':'Password'}</label><input ref={step==='password'?nextField:undefined} id="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?1:8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/>
        {mode!=='login'&&<small>Use 8 to 128 characters.</small>}
      </>}
      {step==='code'&&<>
        <p>Check {email.trim().toLowerCase()} for a six-digit code. It expires in 5 minutes.</p>
        <label htmlFor="code">Verification code</label><input ref={nextField} id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/>
      </>}
      <button className="button button-primary" type="submit" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':step==='code'?'Verify code':step==='password'?'Save new password':'Send verification code'}</button>
      {step==='code'&&<button className="button button-outline" type="button" disabled={busy||seconds>0} onClick={()=>void submit('send')}>{seconds>0?'Resend in '+seconds+'s':'Resend code'}</button>}
      </fieldset>
    </form>}
    <p ref={completion} tabIndex={step==='done'?-1:undefined} role="status" aria-live="polite">{notice}</p>
    {mode==='login'?<p className="auth-foot"><a href={'/forgot-password'+links}>Forgot password?</a> · <a href={'/register'+links}>Create an account</a></p>:
      <p className="auth-foot"><a href={'/login'+links}>Sign in</a></p>}
  </>;
}
