'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {mountMotion} from '@/lib/motion-effects';
export function DesignMotion(){
 const path=usePathname();
 useEffect(()=>mountMotion(document.body),[path]);
 return null;
}
