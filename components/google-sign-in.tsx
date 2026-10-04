'use client';
import {useEffect,useRef,useState} from 'react';
import Script from 'next/script';

type GoogleIdentity={initialize:(options:{client_id:string;nonce:string;login_hint?:string;callback:(response:{credential:string})=>void;auto_select:boolean})=>void;renderButton:(element:HTMLElement,options:{theme:string;size:string;text:string;shape:string;width:number;locale:string;click_listener:()=>void})=>void};
declare global {interface Window {google?:{accounts:{id:GoogleIdentity}}}}

export function GoogleSignIn({returnTo,email}:{returnTo?:string;email?:string}) {
  const container=useRef<HTMLDivElement>(null);
  const pending=useRef(false);
  const [ready,setReady]=useState(false),[retry,setRetry]=useState(0),[busy,setBusy]=useState(false);
  const [message,setMessage]=useState('Loading Google sign-in…');
  useEffect(()=>{
    if(!ready)return;
    let active=true;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    async function setup(){
      try{
        const response=await fetch('/api/auth/google',{signal:controller.signal,credentials:'same-origin',...(email?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'begin',email})}:{})});
        const config=await response.json() as {error?:string;clientId:string;nonce:string};
        if(!response.ok)throw new Error(config.error||'Google sign-in is unavailable.');
        if(!active||!container.current||!window.google)return;
        window.google.accounts.id.initialize({client_id:config.clientId,nonce:config.nonce,login_hint:email,auto_select:false,callback:async({credential})=>{
          if(!active||pending.current)return;
          pending.current=true;setBusy(true);setMessage('Signing in…');
          try{
            const result=await fetch('/api/auth/google',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential,return_to:returnTo}),signal:AbortSignal.timeout(20000)});
            const data=await result.json() as {error?:string;redirectTo:string};
            if(!result.ok){setMessage(data.error||'Unable to sign in. Please try again.');return;}
            window.location.assign(data.redirectTo);
          }catch{setMessage('Unable to connect. Please check your connection and try again.');}
          finally{pending.current=false;if(active)setBusy(false);}
        }});
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current,{theme:'outline',size:'large',text:email?'signup_with':'signin_with',shape:'rectangular',locale:'en',width:Math.min(400,container.current.clientWidth),click_listener:()=>setMessage('Complete sign-in in the Google window. If you close it or it is blocked, click Sign in with Google to try again.')});
        setMessage('');
      }catch(error){if(active)setMessage(error instanceof Error&&error.name!=='AbortError'?error.message:'Unable to load Google sign-in. Check your connection and retry.');}
      finally{clearTimeout(timeout);}
    }
    void setup();
    return()=>{active=false;controller.abort();clearTimeout(timeout);};
  },[ready,retry,returnTo,email]);
  return <div className="google-sign-in" aria-busy={busy}>
    <Script src="https://accounts.google.com/gsi/client" onReady={()=>setReady(true)} onError={()=>setMessage('Google sign-in could not load. Check your connection, then reload this page.')}/>
    <div ref={container} style={busy?{pointerEvents:'none',opacity:.6}:undefined}/>
    <p role="status" aria-live="polite" className="google-sign-in-status">{message}</p>
    {message&&ready&&!busy&&<button type="button" className="account-link" onClick={()=>setRetry(value=>value+1)}>Retry Google sign-in</button>}
  </div>;
}
