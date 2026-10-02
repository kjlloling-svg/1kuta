'use client';
import {useState} from 'react';
export function LogoutButton(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function logout(){
  setBusy(true);setError('');
  try{const response=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error();window.location.assign('/');}
  catch{setError('Unable to log out. Please check your connection and try again.');setBusy(false);}
 }
 return <span><button className="account-link" type="button" onClick={logout} disabled={busy}>{busy?'Logging out…':'Log out'}</button>{error&&<span role="alert">{error}</span>}</span>;
}
