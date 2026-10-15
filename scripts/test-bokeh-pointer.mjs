import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const listeners=new Map(),mediaListeners=new Map(),frames=new Map();let effect,id=0;
const events={addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};
const motion={matches:false,addEventListener:(k,v)=>mediaListeners.set(k,v),removeEventListener:k=>mediaListeners.delete(k)};
const layer={style:{removeProperty(k){delete this[k];}},parentElement:{getBoundingClientRect:()=>({left:0,top:0,right:1000,bottom:800,width:1000,height:800})}};
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync('components/space-background.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports,require:name=>name==='react'?{useRef:()=>({current:layer}),useEffect:fn=>effect=fn}:name==='react/jsx-runtime'?{jsx:()=>null,jsxs:()=>null}:{},
 matchMedia:()=>motion,window:events,document:events,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key)
});
exports.SpaceBackground();assert.equal(listeners.size,0,'no browser work during render');const cleanup=effect();
const move=listeners.get('pointermove'),flush=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};
move({pointerType:'mouse',clientX:700,clientY:500});move({pointerType:'mouse',clientX:1000,clientY:800});assert.equal(frames.size,1);flush();assert.equal(layer.style.transform,'translate3d(18px,12px,0)');
move({pointerType:'mouse',clientX:1,clientY:1});motion.matches=true;mediaListeners.get('change')();assert.equal(frames.size,0);assert.equal(layer.style.transform,undefined);
move({pointerType:'mouse',clientX:500,clientY:400});assert.equal(frames.size,0,'reduced motion stays static');motion.matches=false;
move({pointerType:'touch',clientX:500,clientY:400});assert.equal(frames.size,0,'touch scrolling does not animate');
move({pointerType:'mouse',clientX:300,clientY:300});flush();listeners.get('scroll')();assert.equal(layer.style.transform,undefined);
move({pointerType:'mouse',clientX:1100,clientY:500});assert.equal(frames.size,0,'outside hero resets');
move({pointerType:'mouse',clientX:200,clientY:200});cleanup();assert.equal(frames.size,0);assert.equal(listeners.size,0);assert.equal(mediaListeners.size,0);assert.equal(layer.style.transform,undefined);
console.log('PASS: SSR-safe setup, coalesced bounded pointer movement, reduced motion, touch, scroll/outside reset and complete unmount cleanup.');
