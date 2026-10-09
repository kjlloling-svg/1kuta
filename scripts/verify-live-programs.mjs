import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
mkdirSync('verification/program-accents',{recursive:true});
try {
 for(const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference',colorScheme:theme});
  await context.addInitScript(t=>localStorage.setItem('archive-theme',t),theme);
  const page=await context.newPage();
  await page.goto('https://kutaslsu.vercel.app/',{waitUntil:'domcontentloaded',timeout:60000});
  const cards=page.locator('.program-tile'); await cards.last().waitFor();
  assert.equal(await cards.count(),7);
  const colors=await cards.evaluateAll(es=>es.slice(0,5).map(e=>getComputedStyle(e).getPropertyValue('--dept-text').trim()));
  assert.equal(new Set(colors).size,5,'live distinct accents');
  assert.equal(await cards.first().evaluate(e=>getComputedStyle(e,'::before').animationName),'department-pulse');
  assert.equal(await cards.first().evaluate(e=>getComputedStyle(e,'::before').borderRightWidth),'2px');
  const track=page.locator('.marquee-track');
  const showcaseColors=await track.locator('ul').first().locator('li').evaluateAll(es=>es.map(e=>getComputedStyle(e).getPropertyValue('--dept-text').trim()));
  assert.equal(new Set(showcaseColors).size,7,'seven live showcase accents');
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationDuration),'36s');
  assert.ok(await page.locator('.marquee-window').evaluate(e=>getComputedStyle(e).maskImage.includes('linear-gradient')));
  await page.locator('.marquee-window').hover();
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'running');
  await track.locator('a').first().focus();
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'running');
  await track.locator('a').first().evaluate(e=>e.blur());
  await page.mouse.move(0,0);
  for(const width of [320,375,768,1024,1280,1440]) {
   await page.setViewportSize({width,height:1000});
   const x=await track.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);
   await page.waitForTimeout(200);
   assert.ok(await track.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41)<x,'live moving left');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.equal(await page.locator('.program-marquee button').count(),0);
  assert.equal(await track.locator('ul[aria-hidden]').isVisible(),false);
  await page.locator('.program-grid').screenshot({path:`verification/program-accents/live-${theme}.png`});
  console.log('PASS live',theme,colors.join(', '),'six widths, fitted border, pulse, automatic motion and static reduced-motion layout');
  await context.close();
 }
} finally {await browser.close();}
