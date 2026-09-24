import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const ui=path.resolve('delegators/portfolio-src/ui.tsx');
const bundle=await build({stdin:{contents:`
  import {createRoot} from 'react-dom/client';
  import {AddressTransactions} from './ByronExchanges';
  import {analyse} from './core';
  const io=(address,value)=>({payment_addr:{bech32:address},value});
  const fact=analyse({tx_hash:'one',tx_timestamp:1,fee:'200000',inputs:[io('exchange','10200000')],outputs:[io('own','10000000')]},new Set(['own']));
  const root=createRoot(document.getElementById('app'));
  window.renderCase=(count,ambiguous=false)=>root.render(<AddressTransactions count={count} facts={count===2?[fact,{...fact,hash:'two'}]:[fact]} address="exchange" entries={ambiguous?[]:[{address:'exchange',name:'Exchange'}]}/>);
  window.renderCase(1);
`,loader:'tsx',resolveDir:path.resolve('delegators/portfolio-src')},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/components/ui/table':ui,'@/components/ui/pagination':ui}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
  await page.goto('http://127.0.0.1:8998/');
  await page.evaluate(()=>{window.TDSPRuntime={createAdaUsdAmount(ada){const span=document.createElement('span');span.textContent=String(ada)+' ADA';return span;}};window.createUniversalOverlay=options=>{const overlay=document.createElement('div');overlay.id=options.id;overlay.append(...options.bodyNodes);document.body.append(overlay);return {overlay};};});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  await page.getByText('10 ADA',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'View ADA amounts'}).count(),0);
  await page.evaluate(()=>window.renderCase(2));
  await page.getByRole('button',{name:'View ADA amounts'}).click();
  await page.locator('#portfolio-byron-amounts-overlay tbody tr').first().waitFor();
  assert.equal(await page.locator('#portfolio-byron-amounts-overlay tbody tr').count(),2);
  await page.evaluate(()=>window.renderCase(0));
  await page.getByText('No loaded transactions',{exact:true}).waitFor();
  console.log('PASS: single transaction inline ADA; multiple transactions retain shared overlay; empty history.');
}finally{await browser.close();}
