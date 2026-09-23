import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const bundle=await build({stdin:{contents:`
  import {createRoot} from 'react-dom/client';
  import {createElement} from 'react';
  import {PortfolioRefresh} from './PortfolioRefresh';
  const root=createRoot(document.getElementById('app'));
  window.renderRefresh=busy=>root.render(createElement(PortfolioRefresh,{busy,disabled:busy,onRefresh:()=>window.refreshes=(window.refreshes||0)+1}));
  window.renderRefresh(false);
`,resolveDir:path.resolve('delegators/portfolio-src')},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<header><span id="portfolio-refresh-action"></span><button id="back">Back</button></header><div id="app"></div>'}));
  await page.goto('http://127.0.0.1:8998/');
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  const refresh=page.getByRole('button',{name:'Refresh Portfolio'});
  await refresh.click();assert.equal(await page.evaluate(()=>window.refreshes),1);
  assert.equal(await refresh.innerText(),'');
  assert.equal(await page.evaluate(()=>document.getElementById('portfolio-refresh-action').nextElementSibling.id),'back');
  await page.evaluate(()=>window.renderRefresh(true));
  await page.waitForFunction(()=>document.querySelector('#portfolio-refresh-action button')?.disabled);
  await page.evaluate(()=>window.dispatchEvent(new Event('tdsp:portfolio-hidden')));
  await refresh.waitFor({state:'detached'});
  await page.evaluate(()=>{const old=document.getElementById('portfolio-refresh-action');const next=document.createElement('span');next.id=old.id;old.replaceWith(next);window.dispatchEvent(new Event('tdsp:portfolio-shown'));});
  await refresh.waitFor();assert.equal(await refresh.isDisabled(),true);
  await page.evaluate(()=>window.renderRefresh(false));await refresh.click();
  assert.equal(await page.evaluate(()=>window.refreshes),2);
  console.log('PASS: icon-only refresh before Back, busy state, close/reopen binding.');
}finally{await browser.close();}
