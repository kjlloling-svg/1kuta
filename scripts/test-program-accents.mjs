import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {themeTestServer} from './theme-test-server.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='verification/program-accents';fs.mkdirSync(out,{recursive:true});
const server=await themeTestServer(),{sqlite}=await import('./local-database.mjs');let browser;
const diplomas=['dit-computer-technology','dit-mechanical-technology'];
// Legacy rows must not prevent the catalog from adding the new programs.
for(const slug of diplomas)sqlite.prepare('DELETE FROM programs WHERE slug=?').run(slug);
for(const slug of ['legacy-one','legacy-two'])sqlite.prepare('INSERT INTO programs(slug,name) VALUES(?,?)').run(slug,slug);
const response=await fetch(server.base+'/api/programs');assert.equal(response.status,200);const catalog=(await response.json()).programs;
for(const slug of diplomas)assert.ok(catalog.some(p=>p.slug===slug),'new program synchronized despite existing row count');
await fetch(server.base+'/api/programs');for(const slug of diplomas)assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM programs WHERE slug=?').get(slug).n,1,'idempotent catalog insertion');
const luminance=hex=>{if(hex.length===4)hex='#'+[...hex.slice(1)].map(x=>x+x).join('');const values=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*values[0]+.7152*values[1]+.0722*values[2];};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const matrix=[],ratios=[],errors=[];
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,375,768,1024,1280,1440])for(const theme of ['light','dark']){
  server.resetLimits();const c=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'no-preference'});await c.addInitScript(t=>localStorage.setItem('archive-theme',t),theme);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(server.base,{waitUntil:'load'});await p.locator('.program-tile').last().waitFor();assert.equal(await p.locator('.program-tile').count(),7);assert.equal(await p.locator('.marquee-track ul').count(),2);assert.equal(await p.locator('.marquee-track ul[aria-hidden=true][inert]').count(),1);assert.equal(await p.locator('.marquee-track ul').first().locator('li').count(),7);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'home overflow');
  const track=p.locator('.marquee-track');await p.mouse.move(0,0);const x=await track.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);await p.waitForTimeout(150);const y=await track.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);assert.notEqual(x,y,'marquee moves');
  const widths=await track.locator('ul').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().width));assert.ok(Math.abs(widths[0]-widths[1])<.1,'identical seamless halves');
  await p.locator('.marquee-window').hover();assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'paused','hover pauses');await p.mouse.move(0,0);
  await track.locator('a').first().focus();assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'paused','content focus pauses');
  await p.getByRole('button',{name:'Pause program strip',exact:true}).click();assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');await p.getByRole('button',{name:'Resume program strip',exact:true}).click();assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'running','Resume works with button still focused and hovered');
  const tokens=await p.locator('.program-tile').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return {tone:e.className,text:s.getPropertyValue('--dept-text').trim(),tint:s.getPropertyValue('--dept-tint').trim(),edge:s.getPropertyValue('--dept-edge').trim(),surface:s.getPropertyValue('--surface').trim(),hover:e.matches(':hover'),focus:e.matches(':focus-visible'),reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,animation:getComputedStyle(e,'::before').animationName,shadow:s.boxShadow};}));
  for(const t of tokens){assert.ok(contrast(t.text,t.tint)>=4.5,'tag text contrast');assert.ok(contrast(t.text,t.surface)>=4.5,'marquee text contrast '+JSON.stringify(t));assert.ok(contrast(t.edge,t.tint)>=3,'UI edge contrast');assert.equal(t.animation,'department-pulse',JSON.stringify(t));assert.notEqual(t.shadow,'none');ratios.push({width,theme,tone:t.tone,text:contrast(t.text,t.tint),marquee:contrast(t.text,t.surface),edge:contrast(t.edge,t.tint)});}
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await track.evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await track.locator('ul[aria-hidden]').isVisible(),false);assert.equal(await p.locator('.program-tile').first().evaluate(e=>getComputedStyle(e,'::before').animationName),'none');assert.notEqual(await p.locator('.program-tile').first().evaluate(e=>getComputedStyle(e).boxShadow),'none','static glow retained');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'static marquee wraps');
  if(width===375||width===1440){await p.locator('.program-marquee').evaluate(e=>e.scrollIntoView({block:'center'}));await p.locator('.program-marquee').screenshot({path:`${out}/marquee-${width}-${theme}.png`});}
  await p.goto(server.base+'/programs',{waitUntil:'load'});assert.equal(await p.locator('.directory-card').count(),7);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'directory overflow');
  if(width===1440){await p.locator('.program-directory').screenshot({path:`${out}/programs-${theme}.png`});await p.addScriptTag({path:'node_modules/.design-audit-tools/node_modules/axe-core/axe.min.js'});const axeResult=await p.evaluate(()=>axe.run(document.querySelector('.program-directory'),{runOnly:{type:'rule',values:['color-contrast','link-name']}}));assert.deepEqual(axeResult.violations.map(v=>v.id),[],'rendered contrast');}
  await p.goto(server.base+'/research-papers?program=dit-mechanical-technology',{waitUntil:'load'});await p.waitForFunction(()=>document.querySelector('#program option[value="dit-mechanical-technology"]'));assert.equal(await p.locator('#program').inputValue(),'dit-mechanical-technology');assert.equal(await p.locator('.filters').evaluate(e=>getComputedStyle(e).getPropertyValue('--dept-text').trim()),tokens[2].text);await p.getByRole('heading',{name:'No papers match these filters',exact:true}).waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'filter overflow');
  matrix.push({width,theme,passed:true});await c.close();console.log('PASS',width,theme);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/matrix.json',JSON.stringify(matrix,null,2));fs.writeFileSync(out+'/contrast.json',JSON.stringify(ratios,null,2));console.log('PASS catalog sync, seven programs, marquee motion and pause/resume, seamless halves, reduced motion, static glow, responsive layout, contrast and filters');
}finally{await browser?.close();await server.close();}

