import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`
import {createRoot} from 'react-dom/client';
import {AssetWalletAddresses} from './AssetWalletAddresses';
createRoot(document.getElementById('app')).render(<AssetWalletAddresses compact addresses={Array.from({length:8},(_,i)=>'addr1'+String(i).repeat(90))} names={['Member','Ledger']}/>);
`,loader:'tsx',resolveDir:path.resolve('delegators/portfolio-src')},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:800}});
 await page.setContent('<div id="app" class="member-portfolio"></div>');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.evaluate(()=>{window.createUniversalOverlay=options=>{
  const overlay=document.createElement('div');overlay.id=options.id;
  const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;
  overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};
 };});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 await page.getByRole('button',{name:'8 wallet addresses',exact:true}).waitFor();
 assert.equal(await page.locator('#app a').count(),0);
 await page.getByRole('button',{name:'8 wallet addresses',exact:true}).click();
 const overlay=page.locator('#portfolio-asset-wallets-overlay');
 await overlay.waitFor();
 await overlay.locator('.portfolio-asset-address-row button').last().waitFor();
 assert.equal(await overlay.locator('a').count(),8);
 assert.equal(await overlay.locator('.portfolio-asset-address-row button').count(),8);
 assert.match(await overlay.innerText(),/Member · Ledger/);
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'No horizontal overflow');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await overlay.waitFor({state:'detached'});
 console.log('PASS: compact address summary, all links and copy controls, back navigation, mobile fit');
}finally{await browser.close();}
