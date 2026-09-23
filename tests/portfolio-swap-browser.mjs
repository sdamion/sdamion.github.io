import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const bundle=await build({stdin:{contents:`
  import {createRoot} from 'react-dom/client';
  import {useState} from 'react';
  import {SwapWallets} from './SwapWallets';
  function Test(){const [wallets,setWallets]=useState([]);return <SwapWallets wallets={wallets} onChange={next=>{window.saved=next;setWallets(next);}}/>;}
  createRoot(document.getElementById('app')).render(<Test/>);
`,loader:'tsx',resolveDir:path.resolve('delegators/portfolio-src')},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1100,height:800}});
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
  await page.goto('http://127.0.0.1:8998/');
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
  await page.evaluate(()=>{
    window.createUniversalOverlay=options=>{
      window.overlayOptions=options;
      const overlay=document.createElement('div');overlay.id=options.id;
      const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;
      overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};
    };
  });
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  await page.getByRole('button',{name:/Swap/}).click();
  assert.equal(await page.evaluate(()=>window.overlayOptions.showBack),true);
  const address='DdzFFzCqrhsur6w6gW7ocpi3NbxdS1HBtwfx7jcAcmv83k5zjd6nVg7WXMrhzDPhyWqrrdu24W8GLEdeCPwSRCRFvvGd2FWJz7pEPrRm';
  await page.getByLabel('Payment or Byron address').fill(address);
  await page.getByRole('button',{name:'Add to Swap',exact:true}).click();
  await page.waitForFunction(()=>window.saved?.length===1);
  assert.equal(await page.evaluate(()=>window.saved[0].group),'swap');
  assert.equal(await page.getByRole('link').getAttribute('href'),`https://cardanoscan.io/address/${address}`);
  await page.getByLabel('Payment or Byron address').fill(address);
  await page.getByRole('button',{name:'Add to Swap',exact:true}).click();
  await page.getByText('This address is already included in your wallets.').waitFor();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:/Swap/}).click();
  await page.getByRole('button',{name:`Remove ${address} from Swap`}).click();
  await page.waitForFunction(()=>window.saved?.length===0);
  console.log('PASS: shared Swap tile/overlay, add, duplicate validation, saved group, link, back and remove.');
}finally{await browser.close();}
