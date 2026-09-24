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
  import {WalletMenu} from './WalletMenu';
  function Test(){const [wallets,setWallets]=useState([]);return <WalletMenu counts={{wallets:1,exchanges:2,byron:3}} wallets={<p>Owned address list</p>} exchanges={<p>Exchange address list</p>} byron={<p>Byron address list</p>} swap={<SwapWallets wallets={wallets} onChange={next=>{window.saved=next;setWallets(next);}}/>}/>;}
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
  for(const [title,content] of [['Wallet addresses','Owned address list'],['DEX / CEX addresses','Exchange address list'],['Combined Byron CEX','Byron address list']]){
    assert.equal(await page.getByText(content,{exact:true}).count(),0);
    await page.getByRole('button',{name:new RegExp(title)}).click();
    await page.getByText(content,{exact:true}).waitFor();
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.getByText(content,{exact:true}).waitFor({state:'detached'});
  }
  await page.getByRole('button',{name:/Swap/}).click();
  assert.equal(await page.evaluate(()=>window.overlayOptions.showBack),true);
  await page.getByRole('button',{name:'Add',exact:true}).waitFor();
  for(const width of [1100,390]){
    await page.setViewportSize({width,height:800});
    const layout=await page.evaluate(()=>{
      const input=document.querySelector('#portfolio-swap-address').getBoundingClientRect();
      const button=document.querySelector('#portfolio-swap-wallets-overlay button[type="submit"]').getBoundingClientRect();
      return {aligned:Math.abs(input.bottom-button.bottom)<2||button.top>=input.bottom, fits:document.documentElement.scrollWidth<=innerWidth};
    });
    assert.equal(layout.aligned,true);
    assert.equal(layout.fits,true);
  }
  assert.equal(await page.getByRole('button',{name:'Add',exact:true}).locator('svg').count(),0);
  assert.equal(await page.evaluate(()=>!!(document.querySelector('#portfolio-swap-wallets-overlay form').compareDocumentPosition(document.querySelector('#portfolio-swap-wallets-overlay table'))&Node.DOCUMENT_POSITION_FOLLOWING)),true);
  const address='DdzFFzCqrhsur6w6gW7ocpi3NbxdS1HBtwfx7jcAcmv83k5zjd6nVg7WXMrhzDPhyWqrrdu24W8GLEdeCPwSRCRFvvGd2FWJz7pEPrRm';
  await page.getByLabel('Stake, payment or Byron address').fill(address);
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.waitForFunction(()=>window.saved?.length===1);
  assert.equal(await page.evaluate(()=>window.saved[0].group),'swap');
  assert.equal(await page.getByRole('checkbox').count(),0);
  assert.equal(await page.getByRole('link').getAttribute('href'),`https://cardanoscan.io/address/${address}`);
  await page.getByLabel('Stake, payment or Byron address').fill(address);
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.getByText('This address is already included in your wallets.').waitFor();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:/Swap/}).click();
  await page.getByRole('button',{name:`Remove ${address} from Swap`}).click();
  await page.waitForFunction(()=>window.saved?.length===0);
  const stake='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
  await page.getByLabel('Stake, payment or Byron address').fill(stake);
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.waitForFunction(()=>window.saved?.length===1);
  assert.equal(await page.getByRole('link').getAttribute('href'),`https://cardanoscan.io/stakekey/${stake}`);
  await page.getByText('Linked addresses awaiting refresh',{exact:true}).waitFor();
  console.log('PASS: all wallet sections use shared tiles and child overlays; back, Swap add/remove and validation.');
}finally{await browser.close();}
