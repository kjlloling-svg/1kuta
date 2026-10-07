import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {themeTestServer} from './theme-test-server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KUTA_PLAYWRIGHT_PATH||'C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='verification/green-bokeh';fs.mkdirSync(out,{recursive:true});
const server=await themeTestServer(),matrix=[],contrasts=[],errors=[],failures=[];let browsers=[];
const smoke=process.argv.includes('--smoke');
const routes=['/','/research-papers','/research-papers/theme-fixture','/browse-by-year','/programs','/about','/faq','/login','/admin','/profile'];
try{
 for(const browserName of (smoke?['Chrome']:['Chrome','Brave'])){
  const browser=await chromium.launch(browserName==='Chrome'?{channel:'chrome',headless:true}:{executablePath:process.cwd()+'/node_modules/.design-brave/browser/brave.exe',headless:true});browsers.push(browser);
  for(const width of (smoke?[375]:[375,768,1920]))for(const theme of ['light','dark'])for(const cvd of ['default','red-green','blue-yellow']){
   server.resetLimits();const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});
   await context.addInitScript(({theme,cvd})=>{try{localStorage.setItem('archive-theme',theme);if(!localStorage.getItem('kuta-color-vision'))localStorage.setItem('kuta-color-vision',cvd);}catch{}window.themeCLS=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.themeCLS+=e.value;}).observe({type:'layout-shift',buffered:true});requestAnimationFrame(()=>{window.firstTheme={theme:document.documentElement.dataset.theme,cvd:document.documentElement.dataset.cvd};});},{theme,cvd});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/hydrat|did not match|server rendered/i.test(m.text()))errors.push(m.text());});
   for(const path of smoke?['/']:routes){
    await context.clearCookies();const role=path==='/admin'?'admin':path==='/profile'?'public':'';
    if(role)await context.addCookies([{name:server.cookie,value:server.sessions[role],url:server.base}]);
    const response=await page.goto(server.base+path,{waitUntil:'load'});assert.equal(response.status(),200,path);
    await page.getByRole('button',{name:'Color vision options',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.color-vision-trigger').disabled);
    await page.waitForFunction(()=>window.firstTheme);assert.deepEqual(await page.evaluate(()=>window.firstTheme),{theme,cvd},'First animation frame uses saved palettes');
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme);assert.equal(await page.locator('html').getAttribute('data-cvd'),cvd);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${browserName} ${width} ${theme} ${cvd} ${path} overflow`);
    if(path==='/'){
     await page.getByRole('button',{name:'Color vision options',exact:true}).click();await page.getByRole('menu').waitFor();
     const box=await page.locator('.color-vision-popover').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,'Menu stays in viewport');
     assert.equal(await page.getByRole('menuitemradio',{checked:true}).count(),1);
     await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'Color vision options',exact:true}).evaluate(e=>e===document.activeElement),true);
     if(width===375||browserName==='Chrome'&&width===1920)await page.screenshot({path:`${out}/${browserName}-${width}-${theme}-${cvd}.png`,fullPage:false});
     const values=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['bg','surface','soft','ink','muted','green','green-deep','on-accent','line','focus','error','error-bg'].map(k=>[k,s.getPropertyValue('--'+k).trim()]));});
     const luminance=h=>{if(h.length===4)h='#'+[...h.slice(1)].map(c=>c+c).join('');const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
     const pairs=[['ink','surface',4.5],['muted','bg',4.5],['muted','soft',4.5],['green','surface',4.5],['green','soft',4.5],['on-accent','green',4.5],['on-accent','green-deep',4.5],['line','soft',3],['focus','surface',3],['error','error-bg',4.5]];
     for(const [a,b,min] of pairs){const [lo,hi]=[luminance(values[a]),luminance(values[b])].sort((a,b)=>a-b);const ratio=(hi+.05)/(lo+.05);contrasts.push({theme,cvd,a,b,ratio});assert.ok(ratio>=min,`${theme} ${cvd} ${a}/${b}: ${ratio}`);}
    }
    if(!smoke&&browserName==='Chrome'&&width===375){
     await page.addScriptTag({path:'node_modules/.design-audit-tools/node_modules/axe-core/axe.min.js'});
     const result=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'rule',values:['color-contrast','button-name','aria-valid-attr-value','aria-required-attr','label']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
     if(result.length){failures.push({path,theme,cvd,result});fs.writeFileSync(`${out}/accessibility-failures.json`,JSON.stringify(failures,null,2));}
    }
    matrix.push({browserName,width,theme,cvd,path,passed:true,CLS:await page.evaluate(()=>window.themeCLS)});
   }
   await context.close();console.log(`PASS ${browserName} ${width} ${theme} ${cvd}`);
   fs.writeFileSync(`${out}/${smoke?'smoke':'route'}-matrix.json`,JSON.stringify(matrix,null,2));
  }
  await browser.close();browsers=browsers.filter(b=>b!==browser);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/accessibility-failures.json`,JSON.stringify(failures,null,2));assert.deepEqual(failures,[],'Rendered accessibility violations');fs.writeFileSync(`${out}/contrast-checks.json`,JSON.stringify(contrasts,null,2));
 console.log(`PASS ${matrix.length} route/theme/viewport cases, token contrast, menu placement, no overflow or hydration exceptions`);
}finally{for(const b of browsers)await b.close();await server.close();}
