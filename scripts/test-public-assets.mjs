import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
const base='http://localhost:'+(process.env.PORT||3000);
const request=path=>fetch(new URL(path,base),{redirect:'manual'});
const assets=new Set();
for(const page of ['/','/research-papers','/about']){
 const response=await request(page);assert.equal(response.status,200,page);const html=await response.text();
 for(const match of html.matchAll(/(?:href|src)="([^" ]+)"/g)){
  const path=match[1].replaceAll('&amp;','&');if(path.startsWith('/_next/')||/^\/(assets|images)\//.test(path))assets.add(path);
 }
}
for(const file of readdirSync('public',{recursive:true}))if(/\.(?:webp|png|jpg|svg|ico|woff2?)$/i.test(file))assets.add('/'+file.replaceAll('\\','/').split('/').map(encodeURIComponent).join('/'));
async function checkAsset(path){
 const response=await request(path),type=response.headers.get('content-type')||'';assert.equal(response.status,200,path);const bytes=await response.arrayBuffer();assert.ok(bytes.byteLength,path);
 const ext=new URL(path,base).pathname;
 if(ext.endsWith('.css')){assert.match(type,/text\/css/);const css=new TextDecoder().decode(bytes);for(const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)){if(!m[1].startsWith('data:')){const u=new URL(m[1],new URL(path,base));if(u.origin===base)assets.add(u.pathname+u.search);}}}
 else if(/\.js$/.test(ext))assert.match(type,/(?:javascript|ecmascript)/);
 else if(/\.(?:woff2?|ttf|otf)$/.test(ext))assert.match(type,/(?:font|application\/font)/);
 else assert.match(type,/image\//,path);
}
for(const path of assets)await checkAsset(path);
for(const [path,status] of [['/api/admin/export.csv',401],['/api/private.png',401],['/admin',307],['/admin/report.png',307],['/api/papers/1/citation',403],['/api/research-papers/theme-fixture/abstract',403]])assert.equal((await request(path)).status,status,path);
const image='/images/about/faculty/frederick-t-villa.webp';
for(let i=0;i<160;i++)await checkAsset(image);
assert.equal((await request('/api/stats')).status,200,'asset requests must not consume the anonymous page budget');
let limited=false;for(let i=0;i<125;i++){const response=await request('/api/stats');await response.arrayBuffer();if(response.status===429)limited=true;else assert.equal(response.status,200);}
assert.ok(limited,'page/API rate limiting remains active');
for(const path of assets)await checkAsset(path);
assert.equal((await fetch(base+image,{method:'HEAD'})).status,200);
assert.equal((await request('/research-papers/not-a-static-file.png')).status,429,'dotted page routes must not bypass the limiter');
assert.equal((await request('/api/private.png')).status,429,'dotted private APIs must not bypass the exhausted limiter');
assert.equal((await fetch(base+image,{method:'POST'})).status,429,'static exemption is read-only');
console.log(`PASS: ${assets.size} assets have correct MIME types before/after 160 anonymous image requests and an exhausted page budget; private API 401, abstract/citation 403, admin redirects preserved before throttling.`);
