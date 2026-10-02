'use client';
import {useEffect,useState} from 'react';
export function ResearchUnlocked({slug}:{slug:string}){
 const [show,setShow]=useState(false);
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;try{if(sessionStorage.getItem('kuta-unlocked-paper')===slug){timer=setTimeout(()=>{try{sessionStorage.removeItem('kuta-unlocked-paper');}catch{}setShow(true);},0);}}catch{}return()=>clearTimeout(timer);},[slug]);
 return show?<p className="card-toast unlock-toast" role="status" aria-live="polite">Welcome back! The abstract and citation are now unlocked.</p>:null;
}
