import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync('components/space-background.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function fixture(path='/',enabled=true){
 const listeners=new Map(),frames=new Map(),effects=[],refs=[];let id=0;
 const events={addEventListener:(k,v)=>{assert.ok(!listeners.has(k),'one listener for '+k);listeners.set(k,v);},removeEventListener:k=>listeners.delete(k)};
 const root={dataset:{},hasAttribute:()=>Object.hasOwn(root.dataset,'scrolled')};
 const window={...events,scrollY:0,innerWidth:1000,innerHeight:800,location:{search:'?program=bsed-mathematics'}};
 const exports={};const style=()=>({setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}});
 const jsx=(type,props)=>({type,props});
 vm.runInNewContext(code,{exports,URLSearchParams,require:name=>name==='react'?{
  useRef:()=>{const ref={current:{style:style()}};refs.push(ref);return ref;},useEffect:fn=>effects.push(fn),useSyncExternalStore:(_subscribe,_snapshot,server)=>enabled||server()
 }:name==='next/navigation'?{usePathname:()=>path}:name==='@/lib/departments'?{departmentAccents:{'bsed-mathematics':{accentToken:'--dept-green-accent'}}}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:{},window,document:{...events,documentElement:root},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key)});
 const tree=exports.SpaceBackground();assert.equal(listeners.size,0,'render does not subscribe');const cleanup=effects.map(fn=>fn());
 const flush=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};
 return {tree,listeners,frames,root,window,background:refs[0].current,cursor:refs[1].current,flush,cleanup:()=>cleanup.forEach(fn=>fn?.())};
}
const full=fixture();assert.equal(full.root.dataset.scrolled,'false');
full.listeners.get('pointermove')({pointerType:'mouse',clientX:700,clientY:500});full.listeners.get('pointermove')({pointerType:'mouse',clientX:1000,clientY:800});assert.equal(full.frames.size,1);full.flush();assert.equal(full.cursor.style.transform,'translate3d(1000px,800px,0)');assert.equal(full.background.style.transform,'translate3d(9px,9px,0)');
for(const [y,expected] of [[25,'true'],[20,'true'],[9,'true'],[8,'false'],[20,'false'],[25,'true'],[0,'false']]){full.window.scrollY=y;full.listeners.get('scroll')();full.flush();assert.equal(full.root.dataset.scrolled,expected,'hysteresis at '+y);}
full.listeners.get('pointerleave')();assert.equal(full.cursor.style.opacity,'0');assert.equal(full.background.style.transform,undefined);
full.listeners.get('pointermove')({pointerType:'touch',clientX:20,clientY:20});assert.equal(full.frames.size,0);
full.listeners.get('pointermove')({pointerType:'mouse',clientX:20,clientY:20});full.cleanup();assert.equal(full.frames.size,0);assert.equal(full.listeners.size,0);assert.equal(full.root.dataset.scrolled,undefined);
const accent=fixture('/research-papers');assert.equal(accent.background.style['--effect-accent'],'var(--dept-green-accent)');accent.listeners.get('pointermove')({pointerType:'mouse',clientX:1000,clientY:800});accent.flush();assert.equal(accent.background.style.transform,'translate3d(2.5px,2.5px,0)');accent.cleanup();
const reduced=fixture('/',false);assert.equal(reduced.listeners.has('pointermove'),false);assert.equal(reduced.tree.props.children[1],false);reduced.window.scrollY=30;reduced.listeners.get('scroll')();reduced.flush();assert.equal(reduced.root.dataset.scrolled,'true');reduced.cleanup();
console.log('PASS: mount-only pointer, one coalesced frame, touch ignored, full/accent motion, program token, 24/8px header hysteresis, reduced/coarse pointer exclusion and complete cleanup.');
