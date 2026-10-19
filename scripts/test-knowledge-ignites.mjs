import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import postcss from 'postcss';
import {themeBootstrapScript} from '../lib/theme.mjs';

function themeFixture({stored=null,dark=false,blocked=false,disabled=false}={}){
 const events={},mediaEvents={},frames=[],control={pressed:'false',setAttribute(_key,value){this.pressed=value;}},root={dataset:{},classList:{add(value){root.ready=value==='theme-ready';}}};
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

console.log('PASS: pre-paint theme selection, storage failure, cross-tab sync, switch state and system preference.');

const init=themeFixture({stored:'dark'});assert.ok(!init.root.ready);init.frames.shift()();assert.ok(!init.root.ready);init.frames.shift()();assert.equal(init.root.ready,true);init.events['kuta-set-theme']({detail:'light'});assert.equal(init.root.ready,true);assert.equal(init.frames.length,0);
const css=postcss.parse(fs.readFileSync('app/motion.css','utf8'));
let surfaceRule=false,reducedRoot=false;
css.walkRules(rule=>{
 if(rule.parent.type==='root'&&rule.selector.includes('html body :is(')&&rule.selector.includes('.paper-card')&&rule.nodes.some(n=>n.prop==='transition'&&n.value.includes('--theme-transition'))){surfaceRule=true;assert.ok(rule.nodes.some(n=>n.prop==='transition'&&n.value.includes('var(--theme-transition)')));}
 if(rule.selector==='html'&&rule.parent.params==='(prefers-reduced-motion:reduce)')reducedRoot=rule.nodes.some(n=>n.prop==='transition'&&n.value==='none'&&n.important);
 if(rule.parent.type==='root'&&rule.selector.includes('*'))assert.ok(!rule.nodes.some(n=>n.prop==='transition'),'No unconditional universal transition');
});
assert.ok(surfaceRule&&reducedRoot);
const accent=postcss.parse(fs.readFileSync('app/green-bokeh.css','utf8'));
accent.walkRules(rule=>{if(rule.parent.type==='root'&&rule.selector.startsWith('html.theme-ready'))assert.ok(rule.nodes.some(n=>n.prop==='transition'&&n.value.includes('--theme-transition')),'Theme-ready override must preserve color transitions');});
console.log('PASS: initial suppression ends after two frames, toggles do not suppress transitions, scoped color transitions survive accent override, reduced-motion root is instant.');
