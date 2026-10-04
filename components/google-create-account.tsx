'use client';
import {useState} from 'react';
import {GoogleSignIn} from './google-sign-in';
export function GoogleCreateAccount({returnTo}:{returnTo:string}){
 const [email,setEmail]=useState(''),[selected,setSelected]=useState('');
 return <><form onSubmit={event=>{event.preventDefault();setSelected(email.trim().toLowerCase());}}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>{setEmail(event.target.value);setSelected('');}}/><button type="submit" className="button button-primary">Create account with this email</button></form>{selected&&<><p>Continue with Google below and choose {selected} to confirm this account is yours.</p><GoogleSignIn key={selected} email={selected} returnTo={returnTo}/></>}<p className="auth-foot">Don’t have a Google account? <a href="https://accounts.google.com/signup">Create one at Google</a>, then come back.</p></>;
}
