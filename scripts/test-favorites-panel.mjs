import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const hooks=[],effects=[],listeners=new Map(),pending=[];let cursor=0,writes=0;
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const react={
 useRef(value){const i=cursor++;return hooks[i]??=( {current:value} );},
 useState(value){const i=cursor++;if(!hooks[i])hooks[i]={value};return [hooks[i].value,next=>{writes++;hooks[i].value=typeof next==='function'?next(hooks[i].value):next;}];},
 useCallback(fn,deps){const i=cursor++;if(!same(hooks[i]?.deps,deps))hooks[i]={deps,value:fn};return hooks[i].value;},
 useEffect(fn,deps){const i=cursor++;if(!same(hooks[i]?.deps,deps)){const previous=hooks[i];hooks[i]={deps,cleanup:previous?.cleanup};effects.push(()=>{previous?.cleanup?.();hooks[i].cleanup=fn();});}}
};
const jsx=(type,props)=>({type,props}),exports={};
vm.runInNewContext(ts.transpileModule(readFileSync('components/favorites-panel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='./favorites-store'?{useFavorites:()=>({ready:false,slugs:new Set(),busy:new Set(),errors:{}})}:name==='@/lib/programs'?{programFor:()=>null}:{},
 fetch:url=>new Promise((resolve,reject)=>pending.push({url,resolve,reject})),
 window:{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)}
});
const render=()=>{cursor=0;return exports.FavoritesPanel();};
const flush=()=>{for(const effect of effects.splice(0))effect();};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const result=(title,page=1)=>({papers:[{id:page,slug:title,title,authors:null,year:2026,program:'Program',program_slug:null}],total:2,page,pages:2});
const resolve=(request,data)=>request.resolve({ok:true,json:async()=>data});
function button(tree,label){if(!tree||typeof tree!=='object')return; if(tree.type==='button'&&tree.props.children===label)return tree;for(const child of [tree.props?.children].flat(Infinity)){const found=button(child,label);if(found)return found;}}
let tree=render();assert.equal(pending.length,0,'render does not fetch');const initialWrites=writes;flush();assert.equal(writes,initialWrites,'effect does not synchronously set state');assert.equal(pending.length,1);
pending[0].reject(new Error('Network failed'));await settle();tree=render();assert.ok(button(tree,'Retry'),'failure gives a retry action');
button(tree,'Retry').props.onClick();tree=render();assert.equal(tree.props.children[1].props.children,'Loading Favorites...');resolve(pending[1],result('First'));await settle();tree=render();
button(tree,'Next').props.onClick();tree=render();flush();assert.equal(pending[2].url,'/api/favorites?page=2');
listeners.get('favorites-changed')();resolve(pending[3],result('Newest',2));await settle();resolve(pending[2],result('Stale',2));await settle();tree=render();assert.match(JSON.stringify(tree),/Newest/);assert.doesNotMatch(JSON.stringify(tree),/Stale/);
listeners.get('focus')();for(const hook of hooks)hook?.cleanup?.();const beforeUnmount=writes;resolve(pending[4],result('Unmounted'));await settle();assert.equal(writes,beforeUnmount,'unmounted requests cannot set state');assert.equal(listeners.size,0);
console.log('PASS: asynchronous initial load, human-readable failure and retry, page selection, stale response rejection, and unmount cleanup.');
