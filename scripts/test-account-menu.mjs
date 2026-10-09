import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {themeTestServer} from './theme-test-server.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KUTA_PLAYWRIGHT_PATH || 'C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='verification/account-menu';fs.mkdirSync(out,{recursive:true});
const server=await themeTestServer();
const {sqlite}=await import('./local-database.mjs');
const name='Alexandria'.repeat(6)+' Beatrice Community Researcher';
const email='longaddress'.repeat(15)+'@department.example.edu';
sqlite.prepare('UPDATE users SET name=?,email=?,picture=? WHERE role=?').run(name,email,'/__account-broken.png','public');
sqlite.prepare('UPDATE users SET name=?,email=?,picture=NULL WHERE role=?').run(name,email.replace('department','faculty'),'admin');
let browser;const matrix=[],errors=[],baseline=new Map();
const geometry=p=>p.evaluate(()=>[...document.querySelectorAll('.header-inner>.brand,.desktop-nav,.header-theme,.mobile-navigation,.site-header')].filter(e=>e.getBoundingClientRect().width).map(e=>{const r=e.getBoundingClientRect();return {className:e.className,x:r.x,y:r.y,width:r.width,height:r.height};}));
try {
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of (process.argv.includes('--desktop-only')?[1280,1440]:[320,375,768,1024,1280,1440]))for(const theme of ['light','dark'])for(const role of ['guest','public','admin']) {
  server.resetLimits();
  const c=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});
  await c.addInitScript(t=>localStorage.setItem('archive-theme',t),theme);
  if(role!=='guest')await c.addCookies([{name:server.cookie,value:server.sessions[role],url:server.base}]);
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/__account-broken.png',r=>r.fulfill({status:404,body:''}));
  await p.goto(server.base+'/faq',{waitUntil:'load'});
  const key=width+'-'+theme,geo=await geometry(p);
  if(role==='guest')baseline.set(key,geo);else assert.deepEqual(geo,baseline.get(key),'same header geometry in every auth state');
  assert.equal(geo.find(g=>g.className==='site-header').height,width<1280?72:80);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page overflow');
  const overlap=await p.locator('.header-inner').evaluate(e=>{const r=[...e.children].map(x=>x.getBoundingClientRect()).filter(x=>x.width);return r.some((x,i)=>i>0&&x.left<r[i-1].right-1);});assert.equal(overlap,false,'header controls do not overlap');
  if(role!=='guest') {
   let panel;
   if(width>=1280) {
    const trigger=p.getByRole('button',{name:'Account menu',exact:true});
    assert.equal(await trigger.getAttribute('aria-haspopup'),'menu');
    assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    await trigger.focus();await p.keyboard.press('ArrowDown');
    panel=p.locator('.account-dropdown');await panel.waitFor();
    assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    await p.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitem');
    await p.waitForFunction(text=>document.activeElement?.textContent===text,role==='admin'?'Dashboard':'Favorites');
    await p.keyboard.press('ArrowDown');await p.waitForFunction(()=>document.activeElement?.textContent==='Log out');
    await p.keyboard.press('ArrowDown');await p.waitForFunction(text=>document.activeElement?.textContent===text,role==='admin'?'Dashboard':'Favorites');
    await p.keyboard.press('End');await p.waitForFunction(()=>document.activeElement?.textContent==='Log out');
    await p.keyboard.press('Home');await p.waitForFunction(text=>document.activeElement?.textContent===text,role==='admin'?'Dashboard':'Favorites');
    assert.notEqual(await p.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle),'none','visible keyboard focus');
    await p.keyboard.press('Escape');await panel.waitFor({state:'hidden'});
    assert.equal(await trigger.evaluate(e=>e===document.activeElement),true,'Escape returns focus');
    await trigger.click();await panel.waitFor();await p.getByRole('heading',{level:1}).click();await panel.waitFor({state:'hidden'});
    assert.equal(await trigger.evaluate(e=>e===document.activeElement),true,'outside click returns focus');
    await trigger.click();await panel.waitFor();
    const shown=await p.locator('.account-first-name').first().isVisible();assert.equal(shown,width>=1440,'first name only on wide screens');
    if(shown)assert.equal(await p.locator('.account-first-name').first().evaluate(e=>getComputedStyle(e).textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth),true,'long first name truncated');
   } else {
    assert.equal(await p.getByRole('button',{name:'Account menu',exact:true}).isVisible(),false);
    await p.getByRole('button',{name:'Menu',exact:true}).click();
    panel=p.locator('.mobile-user-account');await panel.waitFor();
    assert.equal(await p.getByRole('menu').count(),0,'no mobile dropdown');
   }
   assert.equal(await panel.locator('.account-details strong').textContent(),name);
   assert.equal(await panel.locator('.account-details>span').textContent(),role==='admin'?email.replace('department','faculty'):email);
   await panel.locator('[data-slot="avatar-fallback"]').waitFor();assert.equal(await panel.locator('[data-slot="avatar-fallback"]').textContent(),'AR');
   assert.equal(await panel.locator('.account-avatar').evaluate(e=>e.getBoundingClientRect().width),34);
   assert.equal(await panel.locator('.account-menu-link').getAttribute('href'),role==='admin'?'/admin':'/profile');
   assert.equal(await panel.locator('.account-divider + .logout-control button').textContent(),'Log out','logout last after divider');
   assert.equal(await panel.evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'account panel overflow');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'open panel page overflow');
   if(role==='public'&&(width===320||width===768||width===1280||width===1440)) {
    await p.screenshot({path:`${out}/${width}-${theme}.png`});
    await p.addScriptTag({path:'node_modules/.design-audit-tools/node_modules/axe-core/axe.min.js'});
    const violations=await p.evaluate(()=>axe.run({include:['.site-header',...(document.querySelector('.account-dropdown')?['.account-dropdown']:[])]},{runOnly:{type:'rule',values:['color-contrast','button-name','link-name','aria-required-children','aria-required-parent','aria-valid-attr-value','nested-interactive']}}).then(r=>r.violations));
    fs.writeFileSync(`${out}/axe-${width}-${theme}.json`,JSON.stringify(violations,null,2));assert.deepEqual(violations.map(v=>v.id),[],'account accessibility');
   }
  }
  matrix.push({width,theme,role,passed:true});await c.close();console.log('PASS',width,theme,role);
 }
 // Validate a successful photo, responsive menu dismissal, and real logout against the isolated database.
 sqlite.prepare('UPDATE users SET picture=? WHERE role=?').run('/__account-photo.svg','public');
 const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await c.addCookies([{name:server.cookie,value:server.sessions.public,url:server.base}]);const p=await c.newPage();
 await p.route('**/__account-photo.svg',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><rect width="34" height="34" fill="#137A3B"/></svg>'}));
 await p.goto(server.base+'/faq');await p.locator('.account-trigger img').waitFor();
 assert.equal(await p.locator('.account-trigger img').evaluate(e=>e.complete&&e.naturalWidth>0&&getComputedStyle(e).objectFit==='cover'),true);
 await p.getByRole('button',{name:'Account menu',exact:true}).click();await p.getByRole('menu').waitFor();await p.setViewportSize({width:375,height:1000});await p.getByRole('menu').waitFor({state:'hidden'});
 await p.getByRole('button',{name:'Menu',exact:true}).click();
 await p.route('**/api/auth/logout',r=>r.fulfill({status:503,body:'Test outage'}));
 await p.locator('.mobile-user-account').getByRole('button',{name:'Log out',exact:true}).click();await p.locator('.mobile-user-account [role=alert]').waitFor();
 assert.equal(await p.locator('.mobile-user-account').getByRole('button',{name:'Log out',exact:true}).isEnabled(),true,'logout error permits retry');await p.unroute('**/api/auth/logout');
 await p.locator('.mobile-user-account').getByRole('button',{name:'Log out',exact:true}).click();await p.waitForURL(server.base+'/');
 assert.equal((await c.request.get(server.base+'/api/auth/me')).status(),401,'logout revokes session');await c.close();
 const adminContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await adminContext.addCookies([{name:server.cookie,value:server.sessions.admin,url:server.base}]);const ap=await adminContext.newPage();
 await ap.goto(server.base+'/faq');await ap.getByRole('button',{name:'Account menu',exact:true}).click();await ap.locator('.account-dropdown').waitFor();
 await ap.route('**/api/auth/logout',r=>r.fulfill({status:503,body:'Test outage'}));
 await ap.getByRole('menuitem',{name:'Log out',exact:true}).click();await ap.locator('.account-dropdown [role=alert]').waitFor();
 assert.equal(await ap.locator('.account-dropdown').isVisible(),true,'logout error remains visible in menu');await ap.unroute('**/api/auth/logout');
 await ap.getByRole('menuitem',{name:'Log out',exact:true}).click();await ap.waitForURL(server.base+'/');
 assert.equal((await adminContext.request.get(server.base+'/api/auth/me')).status(),401,'desktop logout revokes session');await adminContext.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/matrix.json',JSON.stringify(matrix,null,2));console.log('PASS photo fallback, role checks, keyboard/outside dismissal, responsive menu, logout retry and revocation');
} finally {await browser?.close();await server.close();}
