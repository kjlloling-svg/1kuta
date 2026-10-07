import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {themeTestServer} from './theme-test-server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.KUTA_PLAYWRIGHT_PATH||'C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='verification/green-bokeh',server=await themeTestServer();let browser;
const results=[];
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const c=await browser.newContext({viewport:{width:1280,height:900}});
 await c.addInitScript(()=>{window.ambientFrames=[];const original=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.className==='ambient-background')window.ambientFrames.push(performance.now());return original.apply(this,args);};});
 const p=await c.newPage();await p.goto(server.base,{waitUntil:'load'});await p.waitForFunction(()=>window.ambientFrames.length>4);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'1280px header fits');
 await p.getByRole('button',{name:'Color vision options',exact:true}).focus();await p.keyboard.press('Enter');await p.getByRole('menu').waitFor();await p.keyboard.press('Home');await p.keyboard.press('ArrowDown');await p.keyboard.press('Space');assert.equal(await p.locator('html').getAttribute('data-cvd'),'red-green');
 await p.keyboard.press('Escape');assert.equal(await p.getByRole('button',{name:'Color vision options',exact:true}).evaluate(e=>e===document.activeElement),true);
 await p.reload({waitUntil:'load'});assert.equal(await p.locator('html').getAttribute('data-cvd'),'red-green');
 await p.getByRole('checkbox',{name:'Dark mode',exact:true}).check({force:true});assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');assert.equal(await p.locator('html').getAttribute('data-cvd'),'red-green');
 await p.reload({waitUntil:'load'});assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');assert.equal(await p.locator('html').getAttribute('data-cvd'),'red-green');
 await p.getByRole('button',{name:'Color vision options',exact:true}).click();await p.locator('h1').click();assert.equal(await p.getByRole('menu').isVisible(),false);
 const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await p.evaluate(()=>window.ambientFrames=[]);await p.waitForTimeout(2200);
 const frames=await p.evaluate(()=>window.ambientFrames),gaps=frames.slice(1).map((t,i)=>t-frames[i]).sort((a,b)=>a-b),p95=gaps[Math.floor(gaps.length*.95)]||0;
 assert.ok(frames.length>=20,'Animation progresses at 4x CPU throttling');assert.ok(p95<80,`4x CPU p95 frame gap ${p95}ms`);results.push({check:'4x CPU',frames:frames.length,p95FrameGapMs:p95});await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 const canvas=await p.locator('.ambient-background').evaluate(e=>({events:getComputedStyle(e).pointerEvents,width:e.width,height:e.height,hidden:e.getAttribute('aria-hidden')}));assert.equal(canvas.events,'none');assert.equal(canvas.hidden,'true');assert.ok(canvas.width*canvas.height<=1503000);
 await p.mouse.move(400,250);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>document.elementFromPoint(400,250)?.tagName==='CANVAS'),false);
 // Exercise the browser visibility handler deterministically without changing OS focus.
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const stopped=await p.evaluate(()=>window.ambientFrames.length);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>window.ambientFrames.length),stopped);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForFunction(n=>window.ambientFrames.length>n,stopped);
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);const reduced=await p.evaluate(()=>window.ambientFrames.length);await p.mouse.move(600,450);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>window.ambientFrames.length),reduced);assert.equal(await p.locator('.ambient-background').isVisible(),false);
 const records=[];
 for(const path of ['/programs','/about','/faq','/research-papers','/','/programs','/about','/faq','/research-papers','/']){await p.goto(server.base+path,{waitUntil:'load'});assert.equal(await p.locator('.ambient-background').count(),1);const metric=await cdp.send('Runtime.getHeapUsage');records.push(metric.usedSize);}
 results.push({check:'Native navigation lifecycle',singleCanvas:true,heapBytes:records,note:'Each native navigation gets a new document; no accumulating root canvas. Not a long-duration heap-leak proof.'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.goto(server.base,{waitUntil:'load'});
 for(const deficiency of ['protanopia','deuteranopia','tritanopia'])for(const mode of ['default',deficiency==='tritanopia'?'blue-yellow':'red-green']){await p.evaluate(mode=>window.dispatchEvent(new CustomEvent('kuta-set-cvd',{detail:mode})),mode);await cdp.send('Emulation.setEmulatedVisionDeficiency',{type:deficiency});await p.screenshot({path:`${out}/simulation-${deficiency}-${mode}.png`,fullPage:true});}await cdp.send('Emulation.setEmulatedVisionDeficiency',{type:'none'});
 await c.close();
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});const np=await noJS.newPage();await np.goto(server.base,{waitUntil:'load'});assert.ok(await np.locator('h1').isVisible());assert.ok((await np.evaluate(()=>getComputedStyle(document.body,'::before').backgroundImage)).includes('radial-gradient'));await np.screenshot({path:`${out}/no-javascript.png`,fullPage:true});await noJS.close();
 const failed=await browser.newContext();await failed.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){return args[0]==='2d'?null:original.apply(this,args);};Object.defineProperty(window,'localStorage',{get(){throw new Error('Blocked for test');}});});const fp=await failed.newPage();await fp.goto(server.base,{waitUntil:'load'});await fp.getByRole('button',{name:'Color vision options',exact:true}).click();await fp.getByRole('menuitemradio',{name:'Blue-yellow color deficiency',exact:true}).click();assert.equal(await fp.locator('html').getAttribute('data-cvd'),'blue-yellow');assert.ok(await fp.locator('h1').isVisible());await failed.close();
 const touch=await browser.newContext({viewport:{width:375,height:900},hasTouch:true,isMobile:true});const tp=await touch.newPage();await tp.goto(server.base,{waitUntil:'load'});await tp.getByRole('button',{name:'Color vision options',exact:true}).tap();await tp.getByRole('menuitemradio',{name:'Red-green color deficiency',exact:true}).tap();assert.equal(await tp.locator('html').getAttribute('data-cvd'),'red-green');await tp.touchscreen.tap(20,800);await tp.evaluate(()=>scrollTo(0,500));assert.ok(await tp.evaluate(()=>scrollY)>0);await touch.close();
 results.push({check:'Keyboard, outside close, reload persistence, unchanged light/dark control, canvas hit testing, visibility handler, reduced motion, no-JS, failed canvas/blocked storage, touch and scroll',passed:true});
 fs.writeFileSync(`${out}/motion-checks.json`,JSON.stringify(results,null,2));console.log('PASS motion, palette controls and fallback checks');
}finally{if(browser)await browser.close();await server.close();}
