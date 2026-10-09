'use client';

import {useEffect, useRef, useState} from 'react';
import {ChevronDown} from 'lucide-react';
import Link from './native-link';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from './ui/dropdown-menu';
import {LogoutButton} from './logout-button';

type AccountUser = {name:string; email:string; picture:string|null; role:'admin'|'public'};

function AccountAvatar({user}:{user:AccountUser}) {
  const words=(user.name.trim() || user.email).split(/\s+/);
  const initials=([...(words[0] || '')][0] || '') + (words.length>1 ? [...words[words.length-1]][0] || '' : '');
  return <Avatar className="account-avatar" aria-hidden="true">
    {user.picture && <AvatarImage src={user.picture} alt="" referrerPolicy="no-referrer"/>}
    <AvatarFallback>{initials.toLocaleUpperCase() || '?'}</AvatarFallback>
  </Avatar>;
}

function AccountIdentity({user}:{user:AccountUser}) {
  return <div className="account-identity"><AccountAvatar user={user}/><div className="account-details"><strong>{user.name.trim() || 'Your account'}</strong><span>{user.email}</span></div></div>;
}

function AccountActions({user,menu=false}:{user:AccountUser;menu?:boolean}) {
  const link=<Link className="account-menu-link" href={user.role==='admin'?'/admin':'/profile'}>{user.role==='admin'?'Dashboard':'Favorites'}</Link>;
  return <>{menu?<DropdownMenuItem asChild>{link}</DropdownMenuItem>:link}
    {menu?<DropdownMenuSeparator className="account-divider"/>:<hr className="account-divider"/>}
    <LogoutButton menuItem={menu}/>
  </>;
}

export function AccountMenu({user,mobile=false}:{user:AccountUser;mobile?:boolean}) {
  const [open,setOpen]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    const breakpoint=window.matchMedia('(max-width:1279px)');
    const close=()=>{if(breakpoint.matches)setOpen(false);};
    breakpoint.addEventListener('change',close);
    return()=>breakpoint.removeEventListener('change',close);
  },[open]);
  if(mobile)return <div className="mobile-user-account"><AccountIdentity user={user}/><AccountActions user={user}/></div>;
  return <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
    <DropdownMenuTrigger asChild><button ref={trigger} className="account-trigger" type="button" aria-label="Account menu">
      <AccountAvatar user={user}/><span className="account-first-name">{user.name.trim().split(/\s+/)[0] || 'Account'}</span><ChevronDown size={14} aria-hidden="true"/>
    </button></DropdownMenuTrigger>
    <DropdownMenuContent className="account-dropdown" align="end" sideOffset={10} collisionPadding={16} loop aria-label="Account" onCloseAutoFocus={event=>{
      event.preventDefault();
      if(window.matchMedia('(min-width:1280px)').matches)trigger.current?.focus();
      else document.querySelector<HTMLButtonElement>('.menu-trigger')?.focus();
    }}>
      <AccountIdentity user={user}/><AccountActions user={user} menu/>
    </DropdownMenuContent>
  </DropdownMenu>;
}
