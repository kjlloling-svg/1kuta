import fs from 'node:fs';
import desktopConfig from '../node_modules/.design-audit-tools/node_modules/lighthouse/core/config/desktop-config.js';
import lighthouse from '../node_modules/.design-audit-tools/node_modules/lighthouse/core/index.js';
import {launch} from '../node_modules/.design-audit-tools/node_modules/chrome-launcher/dist/index.js';
import {themeTestServer} from './theme-test-server.mjs';
const label=process.argv[2]||'after',out='verification/green-bokeh';fs.mkdirSync(out,{recursive:true});
const server=await themeTestServer();const results=[];
try{
 for(const mode of ['desktop','mobile'])for(let run=1;run<=3;run++){
  const chrome=await launch({chromeFlags:['--headless=new','--no-first-run','--disable-extensions'],handleSIGINT:false});
  try{
   const report=await lighthouse(server.base+'/',{port:chrome.port,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices']},mode==='desktop'?desktopConfig:undefined);
   fs.writeFileSync(`${out}/${label}-${mode}-${run}.json`,JSON.stringify(report.lhr,null,2));
   const row={mode,run,scores:Object.fromEntries(Object.entries(report.lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)])),CLS:report.lhr.audits['cumulative-layout-shift'].numericValue,LCP:report.lhr.audits['largest-contentful-paint'].numericValue};results.push(row);console.log(JSON.stringify(row));
  }finally{await chrome.kill();}
 }
 fs.writeFileSync(`${out}/${label}-summary.json`,JSON.stringify(results,null,2));
}finally{await server.close();}
