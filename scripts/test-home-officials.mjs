import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {themeTestServer} from './theme-test-server.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KUTA_PLAYWRIGHT_PATH || 'C:/Users/KurtJohn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='verification/home-officials';
fs.mkdirSync(out,{recursive:true});
const server=await themeTestServer();
const {sqlite}=await import('./local-database.mjs');
const programIds=sqlite.prepare('SELECT id FROM programs ORDER BY id').all();
const authorId=sqlite.prepare('SELECT id FROM authors LIMIT 1').get().id;
for(let i=0;i<5;i++) {
  const id=Number(sqlite.prepare("INSERT INTO research_papers(slug,title,year,program_id,abstract,status,keywords) VALUES(?,?,?,?,?,'verified',?)").run(
    'home-layout-'+i,
    i%2?'A short paper title':'Research into campus learning outcomes '+('Verylongunbrokenresearchtitle'.repeat(8)),
    2020+i,programIds[i%programIds.length].id,
    i%2?'A concise abstract.':'An extensive abstract for a varied card. '.repeat(30),
    i%2?'[]':'["Campus research","Study outcomes","Learning"]',
  ).lastInsertRowid);
  sqlite.prepare('INSERT INTO research_paper_authors(paper_id,author_id,position) VALUES(?,?,0)').run(id,authorId);
}

const closeTo=(actual,expected,message,tolerance=1)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${message}: ${actual} versus ${expected}`);
const noOverflow=async(page,label)=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,label+' page overflow');
const rectangles=locator=>locator.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}));
const headerGeometry=page=>rectangles(page.locator('.site-header,.header-inner>.brand,.desktop-nav,.header-theme,.mobile-navigation').filter({visible:true}));
const uniformGrid=async(locator,label)=>{
  const cards=await rectangles(locator);
  assert.ok(cards.length>1,label+' is populated');
  for(const card of cards){closeTo(card.width,cards[0].width,label+' identical width');closeTo(card.height,cards[0].height,label+' identical height');}
  const rows=[];
  for(const card of cards){let row=rows.find(r=>Math.abs(r[0].y-card.y)<1);if(!row){row=[];rows.push(row);}row.push(card);}
  for(const row of rows)for(let i=1;i<row.length;i++)assert.ok(row[i].x>=row[i-1].right+7,label+' separated columns');
  for(let i=1;i<rows.length;i++)assert.ok(rows[i][0].y>=rows[i-1][0].bottom+7,label+' separated rows');
  return {columns:Math.max(...rows.map(r=>r.length)),width:cards[0].width,height:cards[0].height};
};
const axeCheck=async(page,selectors,label)=>{
  await page.addScriptTag({path:'node_modules/.design-audit-tools/node_modules/axe-core/axe.min.js'});
  const result=await page.evaluate(include=>axe.run({include},{runOnly:{type:'rule',values:['color-contrast','image-alt','link-name','button-name','heading-order','nested-interactive']}}),selectors);
  fs.writeFileSync(`${out}/axe-${label}.json`,JSON.stringify(result.violations,null,2));
  assert.deepEqual(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label+' accessibility');
};
let browser;
const errors=[],matrix=[];
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const width of [320,375,768,1024,1280,1440])for(const theme of ['light','dark']) {
    server.resetLimits();
    const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});
    await context.addInitScript(t=>localStorage.setItem('archive-theme',t),theme);
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(server.base,{waitUntil:'load'});
    await page.locator('.program-tile').last().waitFor();
    assert.equal(await page.locator('h1').count(),1,'one homepage h1');
    assert.equal(await page.locator('.program-tile').count(),7,'all program links retained');
    assert.equal(await page.locator('.recent-section .paper-card').count(),3,'recent collection retained');
    const homeGrid=await uniformGrid(page.locator('.program-grid .program-tile'),'program grid');
    const papers=await uniformGrid(page.locator('.recent-section .paper-card'),'recent paper grid');
    assert.ok(homeGrid.columns<4,'fewer competing program cards');
    assert.ok(papers.columns<=2,'recent papers have spacious columns');
    if(width<=375){assert.equal(homeGrid.columns,1);assert.equal(papers.columns,1);}
    const wrappers=await rectangles(page.locator('main>.section>.wrap,main>.kuta-welcome>.wrap,main>.purpose-band>.wrap'));
    assert.ok(wrappers.length>=5,'section containers found');
    for(const wrap of wrappers){closeTo(wrap.x,wrappers[0].x,'section left edges align');closeTo(wrap.width,wrappers[0].width,'section widths align');}
    const surfaces=await page.locator('.program-tile,.recent-section .paper-card').evaluateAll(es=>es.map(e=>({depth:getComputedStyle(e).boxShadow,glass:getComputedStyle(e).backdropFilter})));
    for(const surface of surfaces){assert.notEqual(surface.depth,'none','cards retain soft depth');assert.equal(surface.glass,'none','cards do not stack glass and soft depth');}
    const oldName=await page.locator('main').innerText();assert.equal(oldName.includes('Imelda A. Tangalin, DPM, PhD'),false);
    await noOverflow(page,'home');
    const header=await headerGeometry(page);
    closeTo(header[0].height,width<1280?72:80,'header height preserved');
    await page.locator('.program-grid').screenshot({path:`${out}/home-programs-${width}-${theme}.png`});
    if(width===375||width===1440) {
      await page.screenshot({path:`${out}/home-${width}-${theme}.png`,fullPage:true});
      await axeCheck(page,['main'],`home-${width}-${theme}`);
      await context.addCookies([{name:server.cookie,value:server.sessions.public,url:server.base}]);
      await page.reload({waitUntil:'load'});
      assert.deepEqual(await headerGeometry(page),header,'header geometry preserved when signed in');
      if(width>=1280){await page.getByRole('button',{name:'Account menu',exact:true}).click();await page.getByRole('menuitem',{name:'Favorites',exact:true}).waitFor();await page.keyboard.press('Escape');}
      else {await page.getByRole('button',{name:'Menu',exact:true}).click();await page.locator('.mobile-user-account').getByRole('link',{name:'Favorites',exact:true}).waitFor();await page.keyboard.press('Escape');}
      await noOverflow(page,'signed-in home');
      await context.clearCookies();
    }
    // Exercise real browser animation with system motion enabled, then its accessible static mode.
    await page.emulateMedia({reducedMotion:'no-preference'});
    const track=page.locator('.marquee-track');
    await page.mouse.move(0,0);
    const start=await track.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);
    await page.waitForTimeout(160);
    const end=await track.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);
    assert.ok(end<start,'marquee moves right to left');
    assert.equal(await page.locator('.program-marquee button').count(),0);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await track.evaluate(e=>getComputedStyle(e).animationName),'none','reduced motion is static');
    assert.equal(await track.locator('ul[aria-hidden=true]').isVisible(),false);
    await noOverflow(page,'reduced-motion home');

    await page.goto(server.base+'/about',{waitUntil:'load'});
    const president=page.locator('.about-person-president');
    const director=page.locator('.about-person-director');
    const faculty=page.locator('.about-faculty>.about-person');
    const librarian=faculty.filter({hasText:'Jhon Kenneth Aguado'});
    assert.equal(await president.locator('h4').innerText(),'Frederick T. Villa, DTech');
    assert.equal(await president.locator('p').innerText(),'SLSU University President');
    assert.equal(await director.locator('h4').innerText(),'Imelda A. Tangalin');
    assert.equal(await director.locator('img').getAttribute('alt'),'Imelda A. Tangalin, Campus Director');
    assert.equal(new URL(await director.locator('img').getAttribute('src'),server.base).pathname,'/images/about/faculty/imelda-a-tangalin.jpg');
    assert.equal(new URL(await president.locator('img').getAttribute('src'),server.base).pathname,'/images/about/faculty/frederick-t-villa.jpg');
    assert.equal(await faculty.count(),6,'six equally sized Tier 3 cards');
    assert.equal(await librarian.locator('p').innerText(),'SLSU Gumaca University Librarian');
    assert.equal(await librarian.locator('img').count(),0,'missing photo uses initials only');
    assert.equal(await librarian.locator('.person-portrait-fallback').innerText(),'JA');
    assert.equal(await page.locator('.about-researchers>.about-person').count(),3,'researchers retained');
    assert.equal((await page.locator('main').innerText()).includes('DPM'),false,'old name removed');
    const tier3=await uniformGrid(faculty,'faculty grid');
    assert.ok(tier3.columns<=3,'clear faculty hierarchy');
    if(width<=375)assert.ok(tier3.columns<=2,'mobile faculty 1–2 columns');
    const [presidentRect]=await rectangles(president),[directorRect]=await rectangles(director),[leadershipRect]=await rectangles(page.locator('.about-leadership'));
    closeTo(presidentRect.width,leadershipRect.width,'president full width');
    assert.ok(presidentRect.height>directorRect.height,'president is largest feature');
    if(width<=768)closeTo(directorRect.width,leadershipRect.width,'mobile director full width');
    const presidentPortrait=await president.locator('.about-portrait').evaluate(e=>e.getBoundingClientRect().width);
    const directorPortrait=await director.locator('.about-portrait').evaluate(e=>e.getBoundingClientRect().width);
    const facultyPortrait=await faculty.first().locator('.about-portrait').evaluate(e=>e.getBoundingClientRect().width);
    assert.ok(presidentPortrait/facultyPortrait>=1.5&&presidentPortrait/facultyPortrait<=1.8,'president portrait is 1.5–1.8x faculty');
    assert.ok(presidentPortrait>directorPortrait&&directorPortrait>facultyPortrait,'portrait size hierarchy');
    const images=await page.locator('.about-portrait img').evaluateAll(es=>es.map(e=>({src:e.getAttribute('src'),alt:e.alt,loading:e.loading,width:Number(e.getAttribute('width')),height:Number(e.getAttribute('height')),objectFit:getComputedStyle(e).objectFit})));
    for(const image of images){assert.ok(image.alt.length>8,'descriptive portrait alt');assert.equal(image.loading,'lazy');assert.ok(image.width>0&&image.height>0,'explicit portrait dimensions');assert.equal(image.objectFit,'cover');}
    for(const portrait of await rectangles(page.locator('.about-portrait')))closeTo(portrait.width,portrait.height,'portrait aspect ratio fixed square');
    await president.scrollIntoViewIfNeeded();await president.locator('img').evaluate(e=>e.decode());
    await director.scrollIntoViewIfNeeded();await director.locator('img').evaluate(e=>e.decode());
    await faculty.last().scrollIntoViewIfNeeded();
    await noOverflow(page,'about');
    await page.locator('#team').screenshot({path:`${out}/officials-${width}-${theme}.png`});
    if(width===375||width===1440)await axeCheck(page,['#team'],`officials-${width}-${theme}`);
    matrix.push({width,theme,programColumns:homeGrid.columns,paperColumns:papers.columns,facultyColumns:tier3.columns,presidentPortrait,directorPortrait,facultyPortrait,passed:true});
    await context.close();console.log('PASS home and officials',width,theme);
  }
  // A delayed failed image must leave the portrait and card boxes unchanged.
  const context=await browser.newContext({viewport:{width:375,height:1000},reducedMotion:'reduce'});
  let failPortrait;
  const failure=new Promise(resolve=>failPortrait=resolve);
  await context.route('**/images/about/faculty/frederick-t-villa.jpg*',async route=>{await failure;await route.fulfill({status:404,body:''});});
  const page=await context.newPage();await page.goto(server.base+'/about',{waitUntil:'domcontentloaded'});
  const president=page.locator('.about-person-president');await president.scrollIntoViewIfNeeded();
  const before=await rectangles(president.locator('.about-portrait'));
  failPortrait();await president.locator('.person-portrait-fallback').waitFor();
  assert.equal(await president.locator('.person-portrait-fallback').innerText(),'FV','failed image initials');
  assert.deepEqual(await rectangles(president.locator('.about-portrait')),before,'failed photo has no layout shift');
  assert.ok(await president.getByRole('img').getAttribute('aria-label'),'fallback keeps accessible identity');
  await context.close();
  assert.deepEqual(errors,[],'no browser errors');
  fs.writeFileSync(out+'/matrix.json',JSON.stringify(matrix,null,2));
  console.log('PASS 12 viewport/theme combinations, varied paper data, header state, marquee, exact identities, tier geometry, contrast, lazy portraits and failed-image stability');
} finally {await browser?.close();await server.close();}
