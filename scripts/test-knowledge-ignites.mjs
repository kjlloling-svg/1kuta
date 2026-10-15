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

let reduced=false,created=0,removed=0,frames=new Map(),id=0,swaps=0,gradients=0,draws=0;
const listeners=new Map(),motionListeners=new Map(),canvasList=[];
const motion={get matches(){return reduced;},addEventListener:(k,v)=>motionListeners.set(k,v),removeEventListener:k=>motionListeners.delete(k)};
const ctx={setTransform(){},createRadialGradient(){gradients++;return {addColorStop(){}};},clearRect(){draws++;},fillRect(){},beginPath(){},arc(){},stroke(){},moveTo(){},lineTo(){},save(){},translate(){},rotate(){},scale(){},fill(){},restore(){}};
Object.assign(globalThis,{innerWidth:1440,innerHeight:900,devicePixelRatio:3,matchMedia:()=>motion,Path2D:class{},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),window:{addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)},document:{hidden:false,createElement(){created++;const c={style:{},dataset:{},setAttribute(){},getContext:()=>ctx,remove(){removed++;}};canvasList.push(c);return c;},body:{appendChild(){}},addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)}});
const tick=time=>{const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(time);};
reduced=true;supernova(10,10,'dark',()=>swaps++);assert.equal(created,0);assert.equal(frames.size,0);assert.equal(swaps,1);
reduced=false;swaps=0;const stop=supernova(1200,40,'dark',()=>swaps++);assert.equal(canvasList[0].width,2880);const initialGradients=gradients;supernova(20,20,'light',()=>swaps++);assert.equal(created,1);assert.equal(frames.size,1);
tick(0);tick(269);assert.equal(swaps,0);tick(270);tick(500);assert.equal(swaps,1);assert.equal(gradients,initialGradients);tick(1200);assert.equal(frames.size,0);assert.equal(removed,1);assert.equal(listeners.size,0);stop();assert.equal(removed,1);
const cancel=supernova(5,5,'light',()=>swaps++);tick(0);cancel();tick(1000);assert.equal(swaps,1);assert.equal(frames.size,0);
supernova(5,5,'light',()=>swaps++);reduced=true;motionListeners.get('change')();assert.equal(swaps,2);assert.equal(frames.size,0);
reduced=false;supernova(5,5,'dark',()=>swaps++);listeners.get('pagehide')();assert.equal(frames.size,0);assert.equal(swaps,2);
supernova(5,5,'dark',()=>swaps++);listeners.get('resize')();assert.equal(frames.size,0);assert.equal(swaps,2);
console.log('PASS: storage precedence/fallback, blocked storage, hydration-safe ARIA sync, cross-tab/system theme changes, instant reduced motion, one canvas, one swap at 270ms, DPR cap, precomputed gradients, re-entry guard, cancellation and cleanup.');
