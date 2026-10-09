'use client';
import {useState} from 'react';
import {DropdownMenuItem} from './ui/dropdown-menu';
export function LogoutButton({menuItem=false}:{menuItem?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function logout(){
  setBusy(true);setError('');
  try{const response=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error();window.location.assign('/');}
  catch{setError('Unable to log out. Please check your connection and try again.');setBusy(false);}
 }
 const button=<button className="account-link" type="button" onClick={logout} disabled={busy} aria-busy={busy}>{busy?'Logging out…':'Log out'}</button>;
 return <span className="logout-control">{menuItem?<DropdownMenuItem asChild disabled={busy} onSelect={event=>event.preventDefault()}>{button}</DropdownMenuItem>:button}{error&&<span role="alert">{error}</span>}</span>;
}
