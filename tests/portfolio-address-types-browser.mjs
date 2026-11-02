import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const entries={cardano:[{address:'stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',name:'ADA Source',dex:true,out:true}],ethereum:[{address:'0x'+'1'.repeat(40),name:'ETH Source',dex:true,out:true}],solana:[{address:'11111111111111111111111111111111',name:'SOL Source',dex:true,out:true}],bitcoin:[{address:'1BoatSLRHtKNngkdXEeobR76b53LETtpyT',name:'BTC Source',dex:true,out:true}]};
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';import {useState} from 'react';
import {AddressList} from './AddressList';import {nativeAddressRows} from './native-addresses';import {cardanoAddressRows} from './cardano-addresses';
import {bitcoinWallets} from './bitcoin';import {ethereumWallets} from './ethereum';import {nativeWallets} from './solana';import {normalizeCexAddresses} from './cex';
const normalize={cardano:normalizeCexAddresses,ethereum:ethereumWallets,solana:nativeWallets,bitcoin:bitcoinWallets};
function Fixture(){
 const [saved,setSaved]=useState(()=>JSON.parse(localStorage.getItem('address-types')||'${JSON.stringify(entries)}'));window.saved=saved;
 const save=network=>rows=>{if(window.rejectSave)return false;const next={...saved,[network]:normalize[network](rows)};localStorage.setItem('address-types',JSON.stringify(next));setSaved(next);return true;};
 const rows=Object.keys(normalize).flatMap(network=>{
  const book={network,enabled:true,exchanges:saved[network],wallets:[],balance:()=>undefined,usd:null,saveWallets:()=>true,saveExchanges:save(network),snapshot:null,memberStake:'primary',busy:false,onView:()=>{}};
  return network==='cardano'?cardanoAddressRows(book):nativeAddressRows(book);
 });
 return <main className="member-portfolio"><AddressList rows={rows}/></main>;
}createRoot(document.getElementById('app')).render(<Fixture/>);
`},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 const mount=async()=>{await page.goto('http://127.0.0.1:8997/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});await page.locator('tbody tr').first().waitFor();};
 await mount();
 for(const [network,[entry]]of Object.entries(entries)){
  const row=page.locator(`tr[data-address-id="${network}:cex:${entry.address}"]`),open=()=>row.getByRole('button',{name:'Actions for '+entry.name,exact:true}).click();
  await open();assert.equal(await page.getByRole('menuitemradio').count(),4);assert.equal(await page.getByRole('menuitemradio',{name:'DEX',exact:true}).getAttribute('aria-checked'),'true');
  await page.evaluate(()=>{window.rejectSave=true;});await page.getByRole('menuitemradio',{name:'SVC · Services',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Could not save the selection.'}).waitFor();assert.equal(await page.evaluate(network=>window.saved[network][0].dex,network),true);
  await page.evaluate(()=>{window.rejectSave=false;});
  for(const [type,label]of [['min','MIN · Mining'],['svc','SVC · Services'],['cex','CEX'],['dex','DEX']]){
   await open();await page.getByRole('menuitemradio',{name:label,exact:true}).click();
   const saved=await page.evaluate(network=>window.saved[network][0],network);assert.equal(saved.address,entry.address);assert.equal(saved.name,entry.name);assert.equal(saved.out,false,'switching back to an exchange does not automatically enable OUT');
   if(type==='min'||type==='svc'){assert.equal(saved.miner,true);assert.equal(saved.sourceType,type);}else{assert.notEqual(saved.miner,true);assert.equal(saved.sourceType,undefined);}
   await open();assert.equal(await page.getByRole('menuitemradio',{name:label,exact:true}).getAttribute('aria-checked'),'true');await page.keyboard.press('Escape');
  }
  await open();await page.getByRole('menuitemradio',{name:'SVC · Services',exact:true}).click();
 }
 await mount();
 for(const [network,[entry]]of Object.entries(entries)){
  const row=page.locator(`tr[data-address-id="${network}:cex:${entry.address}"]`);assert.match(await row.innerText(),/SVC/);assert.equal(await row.getByRole('checkbox',{name:'Mining / services source: '+entry.name,exact:true}).isChecked(),true);
  await row.getByRole('button',{name:'Actions for '+entry.name,exact:true}).click();assert.equal(await page.getByRole('menuitemradio',{name:'SVC · Services',exact:true}).getAttribute('aria-checked'),'true');
  await page.keyboard.press('Home');assert.equal(await page.getByRole('menuitemradio',{name:'DEX',exact:true}).evaluate(node=>node===document.activeElement),true);await page.keyboard.press('Escape');
 }
 for(const width of [1200,390,320]){
  await page.setViewportSize({width,height:900});await page.getByRole('button',{name:'Actions for BTC Source',exact:true}).click();
  const box=await page.getByRole('menu').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=900);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'/tmp/portfolio-address-types-'+width+'.png'});await page.keyboard.press('Escape');
 }
 assert.deepEqual(errors,[]);console.log('PASS: shared ADA/ETH/SOL/BTC DEX/CEX/MIN/SVC menu, checked state, failed saves, persistent source types, OUT isolation, unchanged identity, keyboard and mobile layout.');
}finally{await browser.close();}
