import assert from 'node:assert/strict';
import {mountMotion} from '../lib/motion-effects.ts';

class Element{
 constructor(kind='card'){this.kind=kind;this.dataset={};this.style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};this.children=[];this.isConnected=true;this.listeners=new Map();}
 addEventListener(k,fn,options){this.listeners.set(k,{fn,options});}
 removeEventListener(k){this.listeners.delete(k);}
 emit(k,event={}){this.listeners.get(k)?.fn({type:k,target:this,...event});}
 setAttribute(){}
 appendChild(child){child.parentElement=this;this.children.push(child);}
 remove(){this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.isConnected=false;}
 matches(){return this.kind==='card';}
 closest(selector){return selector==='dialog'?null:this.kind==='card'?this:null;}
 querySelector(){return null;}
 querySelectorAll(){return this.kind==='root'?this.children.filter(x=>x.kind==='card'):[];}
 contains(node){return node===this||this.children.includes(node);}
 getBoundingClientRect(){this.reads=(this.reads||0)+1;return {left:20,top:30};}
}
function fixture({reduced=false,fine=true,solid=false}={}){
 const root=new Element('root'),card=new Element();root.appendChild(card);
 const preferences=[reduced,fine,solid].map(matches=>Object.assign(new Element('media'),{matches}));
 const frames=new Map(),observers=[],mutations=[],window=new Element('window');let frameId=0;
 class IntersectionObserver{constructor(fn){this.fn=fn;this.observed=new Set();observers.push(this);}observe(el){this.observed.add(el);}unobserve(el){this.observed.delete(el);}disconnect(){this.observed.clear();this.disconnected=true;}intersect(el){if(this.observed.has(el))this.fn([{target:el,isIntersecting:true}]);}}
 class MutationObserver{constructor(fn){this.fn=fn;mutations.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 window.IntersectionObserver=IntersectionObserver;
 Object.assign(globalThis,{Element,Node:Element,IntersectionObserver,MutationObserver,window,document:{activeElement:null,createElement:()=>new Element('light')},matchMedia:q=>q.includes('reduced-motion')?preferences[0]:q.includes('pointer: fine')?preferences[1]:preferences[2],requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)});
 const cleanup=mountMotion(root),flush=()=>{const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn());};
 return {root,card,preferences,frames,observers,mutations,window,cleanup,flush};
}
const t=fixture();assert.equal(t.card.dataset.reveal,undefined,'content is visible before intersection');assert.equal(t.card.children.length,1);
t.observers[0].intersect(t.card);assert.equal(t.card.dataset.reveal,'running');t.root.emit('animationend',{target:t.card,animationName:'motion-reveal'});assert.equal(t.card.dataset.reveal,'done');t.observers[0].intersect(t.card);assert.equal(t.card.dataset.reveal,'done','does not replay');
for(const [x,y] of [[50,70],[100,110]])t.root.emit('pointermove',{target:t.card,clientX:x,clientY:y,pointerType:'mouse'});
assert.equal(t.frames.size,1);assert.equal(t.card.reads,undefined,'no synchronous geometry read');t.flush();assert.equal(t.card.reads,1);assert.equal(t.card.style['--mx'],'80px');assert.equal(t.card.style['--my'],'80px');
t.root.emit('pointerdown',{target:t.card,clientX:70,clientY:90,pointerType:'touch',pointerId:2,button:0});assert.equal(t.card.dataset.pressed,'true');t.window.emit('pointercancel',{pointerId:2});assert.equal(t.card.dataset.pressed,undefined);assert.equal(t.frames.size,0);
const next=new Element();t.root.appendChild(next);t.mutations[0].fn();t.mutations[0].fn();assert.equal(t.frames.size,1);t.flush();assert.ok(t.observers[0].observed.has(next));assert.equal(next.children.length,1);t.root.emit('focusin',{target:next});assert.equal(next.dataset.reveal,'done');assert.equal(t.observers[0].observed.has(next),false);
t.root.emit('pointermove',{target:t.card,pointerType:'mouse',clientX:70,clientY:90});t.cleanup();assert.equal(t.frames.size,0);assert.equal(t.root.listeners.size,0);assert.equal(t.window.listeners.size,0);assert.equal(t.card.children.length,0);assert.equal(t.card.dataset.reveal,undefined);assert.equal(t.observers[0].disconnected,true);assert.equal(t.mutations[0].disconnected,true);for(const media of t.preferences)assert.equal(media.listeners.size,0);
const mobile=fixture({fine:false});mobile.root.emit('pointermove',{target:mobile.card,pointerType:'touch',clientX:70,clientY:90});assert.equal(mobile.frames.size,0);mobile.root.emit('pointerdown',{target:mobile.card,pointerType:'touch',pointerId:3,button:0,clientX:70,clientY:90});mobile.flush();assert.equal(mobile.card.style['--mx'],'50px');mobile.window.emit('pointerup',{pointerId:3});assert.equal(mobile.card.dataset.spotlight,undefined);mobile.cleanup();
const reduced=fixture({reduced:true});assert.equal(reduced.card.dataset.reveal,'done');assert.equal(reduced.observers[0].observed.size,0);reduced.root.emit('pointermove',{target:reduced.card,pointerType:'mouse'});assert.equal(reduced.frames.size,0);reduced.cleanup();
const solid=fixture({solid:true});solid.root.emit('pointerdown',{target:solid.card,pointerType:'touch',pointerId:4,button:0});assert.equal(solid.frames.size,0);solid.cleanup();
console.log('PASS: once-only and dynamic reveals, keyboard visibility, coalesced pointer geometry, touch press/release/cancel, reduced preferences, no default-action interception, complete frame/listener/observer/DOM cleanup.');
