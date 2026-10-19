import assert from 'node:assert/strict';
import vm from 'node:vm';
import {themeBootstrapScript} from '../lib/theme.mjs';
import {supernova} from '../lib/supernova.ts';

function themeFixture({stored=null,dark=false,blocked=false,disabled=false}={}){
 const events={},mediaEvents={},frames=[],control={pressed:'false',setAttribute(_key,value){this.pressed=value;}},root={dataset:{},classList:{add(){}}};
 const document={documentElement:root,querySelectorAll:()=>disabled?[]:[control]};
 const storage={getItem(){if(blocked)throw Error('blocked');return stored;},setItem(_key,value){if(blocked)throw Error('blocked');stored=value;}};
 const media={matches:dark,addEventListener:(name,fn)=>mediaEvents[name]=fn};
 const window={addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:event=>events[event.type]?.(event)};
 vm.runInNewContext(themeBootstrapScript,{document,localStorage:storage,window,matchMedia:()=>media,Event:class{constructor(type){this.type=type;}},requestAnimationFrame:fn=>frames.push(fn)});
 return {events,mediaEvents,media,control,root,frames,setStorage:value=>stored=value};
}
for(const [options,expected] of [[{stored:'light',dark:true},'light'],[{stored:'dark'},'dark'],[{dark:true},'dark'],[{blocked:true,dark:true},'dark'],[{stored:'invalid'},'light']]){
 const t=themeFixture(options);assert.equal(t.root.dataset.theme,expected);assert.equal(t.control.pressed,String(expected==='dark'));
}
const unhydrated=themeFixture({dark:true,disabled:true});assert.equal(unhydrated.control.pressed,'false');assert.equal(unhydrated.root.dataset.theme,'dark');
const theme=themeFixture();theme.events['kuta-set-theme']({detail:'dark'});assert.equal(theme.control.pressed,'true');assert.equal(theme.root.dataset.theme,'dark');theme.setStorage('light');theme.events.storage({key:'archive-theme'});assert.equal(theme.root.dataset.theme,'light');theme.setStorage(null);theme.media.matches=true;theme.mediaEvents.change();assert.equal(theme.root.dataset.theme,'dark');


let reduced=false,created=0,removed=0,id=0,swaps=0;
const listeners=new Map(),motionListeners=new Map(),timers=new Map(),blooms=[];
const motion={get matches(){return reduced;},addEventListener:(k,v)=>motionListeners.set(k,v),removeEventListener:k=>motionListeners.delete(k)};
Object.assign(globalThis,{innerWidth:1440,innerHeight:900,matchMedia:()=>motion,getComputedStyle:()=>({getPropertyValue:k=>k==='--motion-slow'?'.5s':'250ms'}),setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:key=>timers.delete(key),window:{addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)},document:{documentElement:{},hidden:false,createElement(type){assert.equal(type,'div');created++;const el={style:{setProperty(k,v){this[k]=v;}},dataset:{},setAttribute(){},remove(){removed++;}};blooms.push(el);return el;},body:{appendChild(){}},addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)}});
const tick=time=>{for(const [key,timer] of [...timers])if(timer.ms<=time){timers.delete(key);timer.fn();}};
reduced=true;supernova(10,10,'dark',()=>swaps++);assert.equal(created,0);assert.equal(timers.size,0);assert.equal(swaps,1);
reduced=false;swaps=0;const stop=supernova(1200,40,'dark',()=>swaps++);assert.equal(blooms[0].className,'theme-bloom');assert.equal(blooms[0].style['--bloom-x'],'1200px');supernova(20,20,'light',()=>swaps++);assert.equal(created,1);assert.equal(timers.size,2);assert.deepEqual([...timers.values()].map(t=>t.ms),[250,500]);
tick(249);assert.equal(swaps,0);tick(250);assert.equal(swaps,1);tick(500);assert.equal(timers.size,0);assert.equal(removed,1);assert.equal(listeners.size,0);assert.equal(motionListeners.size,0);stop();assert.equal(removed,1);
const cancel=supernova(5,5,'light',()=>swaps++);cancel();tick(1000);assert.equal(swaps,1);assert.equal(timers.size,0);
supernova(5,5,'light',()=>swaps++);reduced=true;motionListeners.get('change')();assert.equal(swaps,2);assert.equal(timers.size,0);
reduced=false;supernova(5,5,'dark',()=>swaps++);listeners.get('pagehide')();assert.equal(timers.size,0);assert.equal(swaps,2);
supernova(5,5,'dark',()=>swaps++);listeners.get('resize')();assert.equal(timers.size,0);assert.equal(swaps,2);
supernova(5,5,'dark',()=>swaps++);document.hidden=true;listeners.get('visibilitychange')();assert.equal(timers.size,0);assert.equal(swaps,2);
console.log('PASS: theme storage/hydration/ARIA, instant reduced preferences, one CSS bloom, token-based swap and duration, re-entry guard, cancellation and listener/timer cleanup.');
