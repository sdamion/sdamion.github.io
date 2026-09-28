import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import {PortfolioRefresh} from './PortfolioRefresh';createRoot(document.getElementById('app')).render(<PortfolioRefresh busy={true} disabled={true} onRefresh={()=>{window.refreshed=true;}}/>);`,loader:'tsx',resolveDir:path.resolve('delegators/portfolio-src')},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.setContent('<div id="portfolio-refresh-action"></div><div id="app"></div>');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('div');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const help=page.getByRole('button',{name:'Portfolio guide',exact:true});
 await help.click();
 assert.equal(await page.getByRole('button',{name:'Refresh Portfolio',exact:true}).isDisabled(),true);
 const guide=page.locator('#portfolio-guide-overlay');
 await guide.waitFor();
 assert.equal(await guide.locator('h2').count(),8);
 assert.match(await guide.innerText(),/Hide excluded addresses/);
 assert.match(await guide.innerText(),/no transaction or ADA fee/);
 for(const width of [1200,390]){
   await page.setViewportSize({width,height:850});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await guide.waitFor({state:'detached'});
 await help.click();
 await page.evaluate(()=>window.dispatchEvent(new Event('tdsp:portfolio-hidden')));
 await guide.waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>!!window.refreshed),false);
 console.log('PASS: guide icon, content, responsive layout, back and hide lifecycle; refresh untouched');
}finally{await browser.close();}
