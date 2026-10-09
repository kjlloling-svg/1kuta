import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {themeTestServer} from './theme-test-server.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='verification/program-showcase';fs.mkdirSync(out,{recursive:true});
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
  assert.equal(await p.locator('.program-marquee button').count(),0,'no controls');
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationTimingFunction),'linear');
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationIterationCount),'infinite');
  assert.equal(await p.locator('.marquee-window').evaluate(e=>getComputedStyle(e).maskImage.includes('linear-gradient')),true,'edge fades');
  await track.evaluate(e=>window.showcaseAnimation=e.getAnimations()[0]);
  await p.locator('.marquee-window').hover();
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'running','hover keeps moving');
  await track.locator('a').first().focus();
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'running','focus keeps moving');
  assert.equal(await track.evaluate(e=>e.getAnimations()[0]===window.showcaseAnimation),true,'interaction keeps original animation');
  const seam=await track.evaluate(e=>{
    const animation=e.getAnimations()[0],duration=animation.effect.getTiming().duration;
    animation.pause();animation.currentTime=0;
    const first=e.querySelector('ul').getBoundingClientRect().left;
    animation.currentTime=duration-0.001;
    const next=e.querySelectorAll('ul')[1].getBoundingClientRect().left;
    animation.play();return Math.abs(first-next);
  });
  assert.ok(seam<.1,'last-frame copy aligns with first-frame original');
  await p.mouse.move(0,0);await track.locator('a').first().evaluate(e=>e.blur());
  const showcase=await track.locator('ul').first().locator('li').evaluateAll(es=>es.map(e=>({text:getComputedStyle(e).getPropertyValue('--dept-text').trim(),surface:getComputedStyle(e).getPropertyValue('--surface').trim(),pulse:getComputedStyle(e.querySelector('span')).animationName,glow:getComputedStyle(e.querySelector('span')).filter,height:e.getBoundingClientRect().height})));
  assert.equal(new Set(showcase.map(t=>t.text)).size,7,'seven distinct showcase accents');
  for(const t of showcase){assert.ok(contrast(t.text,t.surface)>=4.5,'showcase text contrast');assert.equal(t.pulse,'department-pulse');assert.ok(t.glow.includes('drop-shadow'));assert.equal(t.height,44);}
  await p.locator('.program-marquee').screenshot({path:`${out}/moving-${width}-${theme}.png`});
  const tokens=await p.locator('.program-tile').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return {tone:e.className,text:s.getPropertyValue('--dept-text').trim(),tint:s.getPropertyValue('--dept-tint').trim(),edge:s.getPropertyValue('--dept-edge').trim(),surface:s.getPropertyValue('--surface').trim(),hover:e.matches(':hover'),focus:e.matches(':focus-visible'),reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,animation:getComputedStyle(e,'::before').animationName,shadow:s.boxShadow};}));
  assert.equal(new Set(tokens.slice(0,5).map(t=>t.text)).size,5,"five distinct program colors"); for(const t of tokens){assert.ok(contrast(t.text,t.tint)>=4.5,'tag text contrast');assert.ok(contrast(t.text,t.surface)>=4.5,'marquee text contrast '+JSON.stringify(t));assert.ok(contrast(t.edge,t.tint)>=3,'UI edge contrast');assert.equal(t.animation,'department-pulse',JSON.stringify(t));assert.notEqual(t.shadow,'none');ratios.push({width,theme,tone:t.tone,text:contrast(t.text,t.tint),marquee:contrast(t.text,t.surface),edge:contrast(t.edge,t.tint)});}
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await track.evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await track.locator('ul[aria-hidden]').isVisible(),false);assert.equal(await p.locator('.program-tile').first().evaluate(e=>getComputedStyle(e,'::before').animationName),'none');assert.notEqual(await p.locator('.program-tile').first().evaluate(e=>getComputedStyle(e).boxShadow),'none','static glow retained');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'static marquee wraps');
  assert.equal(await track.locator('li span').first().evaluate(e=>getComputedStyle(e).animationName),'none','static star');
  assert.ok(await track.locator('li span').first().evaluate(e=>getComputedStyle(e).filter.includes('drop-shadow')),'static glow');
  assert.equal(await p.locator('.marquee-window').evaluate(e=>getComputedStyle(e).maskImage),'none','static text has no fade');
  if(width===375||width===1440)await p.locator('.program-marquee').screenshot({path:`${out}/static-${width}-${theme}.png`});
  await p.goto(server.base+'/programs',{waitUntil:'load'});assert.equal(await p.locator('.directory-card').count(),7);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'directory overflow');
  if(width===1440){await p.locator('.program-directory').screenshot({path:`${out}/programs-${theme}.png`});await p.addScriptTag({path:'node_modules/.design-audit-tools/node_modules/axe-core/axe.min.js'});const axeResult=await p.evaluate(()=>axe.run(document.querySelector('.program-directory'),{runOnly:{type:'rule',values:['color-contrast','link-name']}}));assert.deepEqual(axeResult.violations.map(v=>v.id),[],'rendered contrast');}
  await p.goto(server.base+'/research-papers?program=dit-mechanical-technology',{waitUntil:'load'});await p.waitForFunction(()=>document.querySelector('#program option[value="dit-mechanical-technology"]'));assert.equal(await p.locator('#program').inputValue(),'dit-mechanical-technology');assert.equal(await p.locator('.filters').evaluate(e=>getComputedStyle(e).getPropertyValue('--dept-text').trim()),tokens[2].text);await p.getByRole('heading',{name:'No papers match these filters',exact:true}).waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'filter overflow');
  matrix.push({width,theme,passed:true});await c.close();console.log('PASS',width,theme);
 }
 const noJs=await browser.newContext({javaScriptEnabled:false,reducedMotion:'no-preference'});const noJsPage=await noJs.newPage();await noJsPage.goto(server.base);assert.equal(await noJsPage.locator('.marquee-track').evaluate(e=>getComputedStyle(e).animationName),'program-flow','runs with JavaScript disabled');await noJs.close(); assert.deepEqual(errors,[]);fs.writeFileSync(out+'/matrix.json',JSON.stringify(matrix,null,2));fs.writeFileSync(out+'/contrast.json',JSON.stringify(ratios,null,2));console.log('PASS catalog sync, seven programs, automatic motion without interaction restart, seamless boundary, reduced motion, static glow, responsive layout, contrast and filters');
}finally{await browser?.close();await server.close();}

