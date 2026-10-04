'use client';
import {useEffect} from 'react';
// Compare server-verified identity, never tokens or a browser storage flag.
export function SessionRefresh({identity}:{identity:string}){
 useEffect(()=>{
  let pending=false,active=true;
  async function check(){
   if(pending||document.visibilityState==='hidden')return;
   pending=true;
   try{
    const response=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(response.status!==200&&response.status!==401)return;
    const data=await response.json() as {user?:{id:string;role:string}};
    const next=data.user?data.user.id+':'+data.user.role:'';
    if(active&&next!==identity)window.location.reload();
   }catch{/* Keep public browsing usable if the network briefly drops. */}
   finally{pending=false;}
  }
  window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);
  const timer=setInterval(check,60000);void check();
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
 },[identity]);
 return null;
}
