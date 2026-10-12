import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve('node_modules/.browser-tests');
const require=createRequire(import.meta.url);
const {chromium,firefox}=require(process.env.KUTA_PLAYWRIGHT_PATH || 'C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const hash=data=>createHash('sha256').update(data).digest('hex');
const ico=readFileSync('app/favicon.ico');
assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
mkdirSync('verification/favicon',{recursive:true});
for(const [index,size] of [16,32,48].entries()) {
  const entry=6+index*16,length=ico.readUInt32LE(entry+8),offset=ico.readUInt32LE(entry+12);
  assert.equal(ico[entry],size);assert.equal(ico[entry+1],size);
  const frame=ico.subarray(offset,offset+length),metadata=await sharp(frame).metadata();
  assert.equal(metadata.width,size);assert.equal(metadata.height,size);assert.equal(metadata.hasAlpha,true);
  writeFileSync(`verification/favicon/ico-${size}.png`,frame);
}
for(const [file,size] of [['icon.png',512],['apple-icon.png',180]]) {
  const m=await sharp('app/'+file).metadata();assert.equal(m.width,size);assert.equal(m.height,size);assert.equal(m.hasAlpha,true);
}

const live=process.argv[2];
const server=live?null:await (await import('./theme-test-server.mjs')).themeTestServer();
const base=live||server.base;
const report=[];
try {
  for(const [name,engine,options] of [['Chrome',chromium,{channel:'chrome'}],['Edge',chromium,{channel:'msedge'}],['Firefox',firefox,{}]]) {
    const browser=await engine.launch({...options,headless:true});
    try {
      // A fresh nonpersistent context has no previous favicon cache or sign-in state.
      const context=await browser.newContext();
      const page=await context.newPage();
      for(const path of ['/','/about']) {
        assert.equal((await page.goto(base+path,{waitUntil:'load',timeout:60000})).status(),200);
        const inspect=async()=>{
          const links=await page.locator('link[rel="icon"],link[rel="apple-touch-icon"]').evaluateAll(es=>es.map(e=>({href:e.href,rel:e.rel,sizes:e.sizes.value,type:e.type})));
          assert.equal(links.length,3,'only automatic framework icons');
          assert.deepEqual(links.map(l=>new URL(l.href).pathname).sort(),['/apple-icon.png','/favicon.ico','/icon.png']);
          for(const link of links) {
            const filename=new URL(link.href).pathname.slice(1);
            const response=await context.request.get(link.href,{headers:{'Cache-Control':'no-cache'}});
            assert.equal(response.status(),200,filename);
            assert.equal(hash(await response.body()),hash(readFileSync('app/'+filename)),filename+' matches the new asset');
            await page.evaluate(async url=>{const image=new Image();image.src=url;await image.decode();if(!image.naturalWidth)throw new Error('Icon cannot decode');},link.href);
          }
          return links;
        };
        const links=await inspect();
        if(name!=='Firefox') {
          const cdp=await context.newCDPSession(page);
          await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
          await Promise.all([page.waitForEvent('load'),cdp.send('Page.reload',{ignoreCache:true})]);
          await cdp.detach();
        } else {
          await context.route('**/*',route=>route.continue());
          await page.reload({waitUntil:'load'});
        }
        await inspect();
        report.push({browser:name,path,privateContext:true,cacheBypassReload:true,links,passed:true});
      }
      assert.equal((await context.request.get(base+'/favicon.svg')).status(),404,'old S icon removed');
      await context.close();console.log('PASS',name,'private session, cache-bypassing reload, three icon formats and old icon removal');
    } finally {await browser.close();}
  }
  writeFileSync(`verification/favicon/${live?'production':'local'}-browser-checks.json`,JSON.stringify(report,null,2));
} finally {await server?.close();}
