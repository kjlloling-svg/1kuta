'use client';
import {useEffect} from 'react';
import {mountProgramMotion} from './program-motion-runtime';
export function ProgramMotion(){useEffect(()=>{const root=document.querySelector<HTMLElement>('.programs-showcase');if(root)return mountProgramMotion(root);},[]);return null;}
