import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src');
const require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {usePortfolioText} from './use-portfolio-text';
import {PaymentLinks} from './PaymentLinks';
import {AssetOverlay} from './AssetOverlay';
window.createUniversalOverlay=({id,titleId,titleText,bodyNodes})=>{
 const overlay=document.createElement('div');overlay.id=id;
 const title=document.createElement('h3');title.id=titleId;title.setAttribute('data-i18n-auto','');title.setAttribute('data-i18n-auto-original',titleText);title.textContent=titleText;
 overlay.append(title,...bodyNodes);document.body.append(overlay);return {overlay};
};
function Fixture(){
 const [count,setCount]=useState(1),[price,setPrice]=useState('123.45');
 const t=usePortfolioText();
 return <><AssetOverlay name="Wallet" literalTitle onClose={()=>{}}><span translate="no">Wallet</span></AssetOverlay><h2>Assets Across Wallets</h2><p id="progress">{count+' of 5 analysing'}</p>
 <strong id="waiting" translate="no">{t('Waiting for transaction details')}</strong>
 <p id="error">Token data unavailable</p><label>Wallet name<input id="price" value={price} onChange={event=>setPrice(event.target.value)} placeholder="e.g. Savings"/></label>
 <button id="change" onClick={()=>setCount(count+1)} aria-label={'Copy wallet address addr1test'+count}>Next</button>
 <strong id="money" translate="no">₳ {count*100} ≈ $123.45</strong>
 <span translate="no" id="wallet">Wallet</span><span className="portfolio-asset-name">Transactions</span>
 <input id="toggle" type="checkbox"/><table><thead><tr><th>Average buy · USD</th></tr></thead><tbody><tr><td data-label="Average buy · USD">123.45</td></tr></tbody></table>
 <div id="purchase"><PaymentLinks id="asset" facts={[{hash:'a'.repeat(64),time:1653955200,adaRaw:'0',assets:{asset:'1'},decimals:{},feeRaw:'0',internal:false,wallets:[],swapCandidate:false}]} links={[]} acquisitions={{['a'.repeat(64)]:{asset:{ada:1000,raw:'1',time:1653955200,paymentHash:'b'.repeat(64),source:'linked-purchase'}}}} history={{'2022-05-31':0.63033}} onSave={()=>{}}/></div></>;
}
createRoot(document.getElementById('app')).render(<Fixture/>);
`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const locale=new URL(route.request().url()).pathname.match(/^\/locales\/(nl|ja|es)\.toml$/);
  await route.fulfill({contentType:locale?'text/plain':'text/html',body:locale?await readFile('locales/'+locale[1]+'.toml','utf8'):'<div class="member-portfolio" id="app"></div>'});
 });
 await page.goto('http://127.0.0.1:8997/');
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 await page.locator('#progress').waitFor();
 for(const file of ['shared/portfolio-i18n-keys.js','shared/portfolio-i18n.js','shared/i18n.js'])await page.addScriptTag({content:await readFile(file,'utf8')});
 await page.evaluate(()=>document.dispatchEvent(new Event('DOMContentLoaded')));
 await page.locator('#price').fill('999.50');await page.locator('#toggle').check();
 await page.evaluate(()=>window.originalText=document.querySelector('#progress').firstChild);
 let count=1;
 for(const lang of ['nl','ja','es','en','nl']){
  await page.evaluate(lang=>window.TDSPI18n.setLanguage(lang),lang);
  await page.waitForFunction(()=>document.querySelector('#waiting').textContent===window.TDSPI18n.translateText('Waiting for transaction details'));
  const expected=await page.evaluate(count=>window.TDSPI18n.translateText(count+' of 5 analysing'),count);
  assert.equal(await page.locator('#progress').innerText(),expected);
  assert.equal(await page.locator('#price').inputValue(),'999.50');
  assert.equal(await page.locator('#waiting').innerText(),await page.evaluate(()=>window.TDSPI18n.translateText('Waiting for transaction details')));
  assert.equal(await page.locator('#toggle').isChecked(),true);
  assert.equal(await page.locator('#wallet').innerText(),'Wallet');
  assert.equal(await page.locator('#portfolio-asset-overlay-title').innerText(),'Wallet','custom overlay title remains literal');
  assert.equal(await page.locator('.portfolio-asset-name').innerText(),'Transactions');
  const purchase=page.locator('#purchase');
  const kind=await page.evaluate(()=>window.TDSPI18n.translateText('Linked purchase'));
  await page.waitForFunction(kind=>document.querySelector('#purchase').textContent.includes(kind),kind);
  assert.ok((await purchase.innerText()).includes(kind),'asset transaction kind translated');
  assert.match(await purchase.innerText(),/630[.,]33/,'historical amount preserved');
  if(lang!=='en'){
    assert.doesNotMatch(await purchase.innerText(),/Historical purchase cost|loaded asset transactions|receipts with purchase costs/,'complete asset detail templates translated');
  }
  assert.equal(await page.locator('td').getAttribute('data-label'),await page.locator('th').innerText());
  assert.ok(await page.evaluate(()=>window.originalText===document.querySelector('#progress').firstChild),'React text node retained');
  await page.locator('#change').click();count++;
  await page.waitForFunction(count=>document.querySelector('#progress').textContent===window.TDSPI18n.translateText(count+' of 5 analysing'),count);
  assert.equal(await page.locator('#money').innerText(),`₳ ${count*100} ≈ $123.45`);
  assert.equal(await page.locator('#change').getAttribute('aria-label'),await page.evaluate(count=>window.TDSPI18n.translateText('Copy wallet address addr1test'+count),count));
 }
 const coverage=await page.evaluate(()=>window.TDSPPortfolioTranslationKeys.length);
 assert.ok(coverage>350);
 for(const lang of ['nl','ja','es']){
  await page.evaluate(lang=>window.TDSPI18n.setLanguage(lang),lang);
  const missing=await page.evaluate(()=>window.TDSPPortfolioTranslationKeys.filter(([text])=>text.length>30&&!text.includes('{')&&window.TDSPI18n.translateText(text)===text).map(([text])=>text));
  assert.deepEqual(missing,[],lang+' long texts have translations');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: '+coverage+' Portfolio messages, NL/JA/ES/EN, React progress updates, attributes, prices, exclusions and names.');
}finally{await browser.close();}
