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
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('.toml'))return route.fulfill({contentType:'text/plain',body:await readFile('.'+url.pathname,'utf8')});
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
  return route.fulfill({contentType:'text/html',body:'<div id="app"></div>'});
 });
 const mount=async()=>{await page.goto('http://127.0.0.1:8997/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});await page.locator('tbody tr').first().waitFor();};
 await mount();
 for(const [network,[entry]]of Object.entries(entries)){
  const row=page.locator(`tr[data-address-id="${network}:cex:${entry.address}"]`),open=()=>row.getByRole('button',{name:'Actions for '+entry.name,exact:true}).click();
  await open();const typeSelect=page.getByRole('combobox',{name:'Address type',exact:true});
  assert.deepEqual(await typeSelect.locator('option').allTextContents(),['DEX','CEX','Mining','Service']);assert.equal(await typeSelect.inputValue(),'dex');assert.equal(await page.getByRole('menuitemradio').count(),0);
  await page.evaluate(()=>{window.rejectSave=true;});await typeSelect.selectOption('svc');
  await page.getByRole('alert').filter({hasText:'Could not save the selection.'}).waitFor();assert.equal(await page.evaluate(network=>window.saved[network][0].dex,network),true);
  assert.equal(await typeSelect.inputValue(),'dex','failed saves restore the saved type');await page.keyboard.press('Escape');await page.evaluate(()=>{window.rejectSave=false;});
  for(const [type,label]of [['min','Mining'],['svc','Service'],['cex','CEX'],['dex','DEX']]){
   await open();await typeSelect.selectOption(type);
   const saved=await page.evaluate(network=>window.saved[network][0],network);assert.equal(saved.address,entry.address);assert.equal(saved.name,entry.name);assert.equal(saved.out,false,'switching back to an exchange does not automatically enable OUT');
   if(type==='min'||type==='svc'){assert.equal(saved.miner,true);assert.equal(saved.sourceType,type);}else{assert.notEqual(saved.miner,true);assert.equal(saved.sourceType,undefined);}
   assert.match(await row.innerText(),new RegExp(label));assert.equal(await typeSelect.inputValue(),type);await page.keyboard.press('Escape');
   await open();assert.equal(await typeSelect.inputValue(),type);await page.keyboard.press('Escape');
  }
  await open();await typeSelect.selectOption('svc');await page.keyboard.press('Escape');
 }
 await mount();
 for(const [network,[entry]]of Object.entries(entries)){
  const row=page.locator(`tr[data-address-id="${network}:cex:${entry.address}"]`);assert.match(await row.innerText(),/Service/);assert.doesNotMatch(await row.innerText(),/\b(?:MIN|SVC)\b/);assert.equal(await row.getByRole('checkbox',{name:'Mining / services source: '+entry.name,exact:true}).isChecked(),true);
  const trigger=row.getByRole('button',{name:'Actions for '+entry.name,exact:true});await trigger.click();const select=page.getByRole('combobox',{name:'Address type',exact:true});assert.equal(await select.inputValue(),'svc');
  assert.equal(await select.evaluate(node=>node===document.activeElement),true);
  for(const key of ['ArrowUp','ArrowDown','Home','End'])assert.equal(await select.evaluate((node,key)=>node.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),key),true,'native select keys are not cancelled by the menu');
  await page.keyboard.press('Tab');assert.equal(await page.getByRole('menuitem',{name:'Track deposits to this address',exact:true}).evaluate(node=>node===document.activeElement),true);
  await page.keyboard.press('Home');assert.equal(await select.evaluate(node=>node===document.activeElement),true);assert.equal(await select.inputValue(),'svc');await page.keyboard.press('Escape');assert.equal(await trigger.evaluate(node=>node===document.activeElement),true);
 }
 const beforeLanguages=await page.evaluate(()=>JSON.stringify(window.saved));
 for(const file of ['shared/portfolio-i18n-keys.js','shared/portfolio-i18n.js','shared/i18n.js'])await page.addScriptTag({content:await readFile(file,'utf8')});
 for(const [language,labels]of [['nl',['DEX','CEX','Mining','Dienst']],['ja',['DEX','CEX','マイニング','サービス']],['es',['DEX','CEX','Minería','Servicio']],['en',['DEX','CEX','Mining','Service']]]){
  await page.evaluate(language=>window.TDSPI18n.setLanguage(language),language);
  const names=await page.evaluate(()=>({actions:window.TDSPI18n.translateText('Actions for {name}').replace('{name}','BTC Source'),type:window.TDSPI18n.translateText('Address type')}));
  await page.getByRole('button',{name:names.actions,exact:true}).click();const select=page.getByRole('combobox',{name:names.type,exact:true});
  assert.deepEqual(await select.locator('option').allTextContents(),labels);assert.equal(await select.inputValue(),'svc');
  await page.locator(`tr[data-address-id="bitcoin:cex:${entries.bitcoin[0].address}"]`).getByText(labels[3],{exact:true}).waitFor();await page.keyboard.press('Escape');
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(window.saved)),beforeLanguages,'language changes never alter saved roles, names or addresses');
 for(const width of [1200,390,320]){
  await page.setViewportSize({width,height:900});await page.getByRole('button',{name:'Actions for BTC Source',exact:true}).click();
  const box=await page.getByRole('menu').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=900);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'/tmp/portfolio-address-types-'+width+'.png'});await page.keyboard.press('Escape');
 }
 assert.deepEqual(errors,[]);console.log('PASS: shared ADA/ETH/SOL/BTC DEX/CEX/Mining/Service dropdown, selected value, failed saves, persistent roles, unchanged identity, native select keyboard behavior, menu focus and mobile layout.');
}finally{await browser.close();}
