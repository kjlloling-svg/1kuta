import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {randomUUID} from 'node:crypto';
import {citationParts,citationStyles} from '../lib/citations.ts';
import * as site from '../lib/site-info.mjs';
import * as content from '../components/research-learning/content.ts';
const require=createRequire(import.meta.url),hooks=[];let cursor=0,requests=0,copied='',copyOK=true;
const react={useRef:value=>{const i=cursor++;return hooks[i]??={current:value};},useState:value=>{const i=cursor++;hooks[i]??={value};return[hooks[i].value,next=>hooks[i].value=next];},useEffect:()=>{}};
const jsx=(type,props)=>({type,props});
const mocks={'react':react,'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/citations':{citationParts,citationStyles},'@/lib/site-info.mjs':site,'@/lib/clipboard.mjs':{copyCitation:async text=>{copied=text;return copyOK;}},'@/components/native-link':{default:'a'},'./content':content,'./motion':{mountLearningMotion:()=>()=>{}}};
function compile(file){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,require:name=>{if(mocks[name])return mocks[name];const target=path.resolve(path.dirname(file),name);for(const ext of ['.tsx','.ts'])if(existsSync(target+ext))return compile(target+ext);return require(name);},fetch:()=>{requests++;throw Error('Learning module must not request protected data');}});return exports;}
const citations=compile('components/research-learning/sample.ts').sampleCitations();
assert.equal(citations.length,8);assert.equal(new Set(citations.map(c=>c.text)).size,8);
for(const c of citations){assert.ok(c.text.includes('Sample: Exploring quiet spaces for learning'));assert.ok(c.text.includes('Fictional Learning Institute'));assert.ok(!c.text.includes(site.ARCHIVE_PUBLISHER));assert.equal(c.text,c.segments.map(s=>s.text).join(''));}
const {LearningClient}=compile('components/research-learning/client.tsx');
function expand(node){if(Array.isArray(node))return node.flatMap(expand);if(!node||typeof node!=='object')return node;if(typeof node.type==='function')return expand(node.type(node.props));return {...node,props:{...node.props,children:expand(node.props?.children)}};}
const render=()=>{cursor=0;return expand(LearningClient({citations}));};
function nodes(node,predicate){if(Array.isArray(node))return node.flatMap(n=>nodes(n,predicate));if(!node||typeof node!=='object')return[];return [...(predicate(node)?[node]:[]),...nodes(node.props?.children,predicate)];}
let tree=render();for(const c of citations){nodes(tree,n=>n.props?.id===`sample-format-tab-${c.id}`)[0].props.onClick();tree=render();const panel=nodes(tree,n=>n.props?.id===`sample-format-panel-${c.id}`)[0];assert.equal(panel.props['aria-hidden'],false);assert.equal(nodes(tree,n=>n.props?.role==='tab'&&n.props['aria-selected']&&n.props.id.startsWith('sample-format')).length,1);await nodes(tree,n=>n.type==='button'&&n.props.onClick&&n.props.children==='Copy sample citation')[0].props.onClick();assert.equal(copied,c.text);tree=render();}
let focused=-1,prevented=false;const tab=nodes(tree,n=>n.props?.id==='sample-format-tab-ris')[0];tab.props.onKeyDown({key:'Home',preventDefault:()=>prevented=true,currentTarget:{parentElement:{querySelectorAll:()=>citations.map((_,i)=>({focus:()=>focused=i}))}}});tree=render();assert.ok(prevented);assert.equal(focused,0);assert.equal(nodes(tree,n=>n.props?.id==='sample-format-tab-apa')[0].props['aria-selected'],true);
copyOK=false;await nodes(tree,n=>n.type==='button'&&n.props.children==='Copy sample citation')[0].props.onClick();tree=render();assert.match(JSON.stringify(nodes(tree,n=>n.props?.role==='status')),/copy it manually/);assert.equal(requests,0);
console.log('PASS: all eight real sample formats, keyboard selection, matching copy output, clipboard failure and zero network requests.');
assert.ok(process.env.DATABASE_PATH?.startsWith('outputs/research-learning/'),'Run with the isolated research-learning test database');
assert.ok(!process.env.TURSO_DATABASE_URL,'Never run these fixture writes against Turso');
const {sqlite}=await import('./local-database.mjs');const marker=randomUUID(),program=sqlite.prepare('SELECT id FROM programs LIMIT 1').get();const secret='PRIVATE_LEARNING_'+marker;
const id=Number(sqlite.prepare("INSERT INTO research_papers(slug,title,year,program_id,abstract,full_text,status) VALUES(?,?,?,?,?,?,'verified')").run('learning-'+marker,'Public learning boundary fixture',2026,program.id,secret,secret).lastInsertRowid);
try{const base='http://localhost:'+process.env.PORT;for(const headers of [{},{RSC:'1'}]){const res=await fetch(base+'/',{headers});assert.equal(res.status,200);const body=await res.text();assert.ok(!body.includes(secret),'guest HTML/RSC must not leak protected fixture fields');assert.ok(body.includes('How research works'));assert.ok(body.includes('Fictional Learning Institute'));assert.ok(!body.includes('Explore by program'));assert.ok(!body.includes('View all programs'));if(!headers.RSC){assert.match(body,/<noscript>/);assert.ok(body.includes('learning-static'));for(const p of content.paperParts)assert.ok(body.includes(p.what));}}
for(const lesson of content.searchLessons){const res=await fetch(base+lesson.href);assert.equal(res.status,200);}
assert.equal((await fetch(base+'/programs')).status,200);console.log('PASS: guest HTML and RSC fixture secrecy, server-rendered no-JS content, real filter routes and preserved Programs route.');
}finally{sqlite.prepare('DELETE FROM research_papers WHERE id=?').run(id);}
// Exercise the actual motion controller without a browser or animation timing guesses.
const listeners=new Map(),frames=new Map();let observerCallback,disconnected=0,frameId=0,rectReads=0;
const target=name=>({addEventListener:(event,fn)=>listeners.set(name+':'+event,fn),removeEventListener:event=>listeners.delete(name+':'+event)});
const paper={...target('paper'),dataset:{},style:{setProperty:()=>{}},getBoundingClientRect:()=>{rectReads++;return {left:10,top:10};}};
const blocks=[{dataset:{}}],root={dataset:{},querySelector:()=>paper,querySelectorAll:()=>blocks};
const reduced={...target('reduced'),matches:false},fine={...target('fine'),matches:true},doc={...target('document'),hidden:false};
const motionExports={};vm.runInNewContext(ts.transpileModule(readFileSync('components/research-learning/motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:motionExports,matchMedia:query=>query.includes('reduced')?reduced:fine,navigator:{connection:{saveData:false}},document:doc,window:target('window'),requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),IntersectionObserver:class{constructor(cb){observerCallback=cb;}observe(){}disconnect(){disconnected++;}},ResizeObserver:class{observe(){}disconnect(){disconnected++;}}});
const cleanup=motionExports.mountLearningMotion(root),move=listeners.get('paper:pointermove');
move({pointerType:'mouse',clientX:20,clientY:30});move({pointerType:'mouse',clientX:25,clientY:35});assert.equal(frames.size,1);assert.equal(rectReads,1);for(const fn of frames.values())fn();frames.clear();assert.equal(paper.dataset.pointer,'true');
reduced.matches=true;listeners.get('reduced:change')();move({pointerType:'mouse',clientX:20,clientY:30});assert.equal(frames.size,0);assert.equal(paper.dataset.pointer,undefined);
reduced.matches=false;fine.matches=false;move({pointerType:'touch',clientX:20,clientY:30});assert.equal(frames.size,0);
observerCallback([{target:blocks[0],isIntersecting:true}]);assert.equal(blocks[0].dataset.learningEntered,'true');observerCallback([{target:blocks[0],isIntersecting:false}]);assert.equal(blocks[0].dataset.learningVisible,'false');
doc.hidden=true;listeners.get('document:visibilitychange')();assert.equal(root.dataset.learningHidden,'true');cleanup();assert.equal(listeners.size,0);assert.equal(frames.size,0);assert.equal(disconnected,2);
console.log('PASS: one scheduled pointer frame, cached geometry, reduced/coarse pointer gating, offscreen/hidden flags and complete listener/observer cleanup.');
