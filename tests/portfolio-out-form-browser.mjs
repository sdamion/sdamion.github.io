import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const addresses={
 cardano:['stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel','addr1q99u68080mhnj34s78e5f2jwgarl342aj70jkleffze93k4l7csm4qlkawkyf9j34kh7sljq8d0mqn8kjypxrs38g78qqvfkfn'],
 ethereum:['0x'+'a'.repeat(40),'0x'+'b'.repeat(40)],
 solana:['11111111111111111111111111111111','So11111111111111111111111111111111111111112'],
 bitcoin:['1BoatSLRHtKNngkdXEeobR76b53LETtpyT','1BitcoinEaterAddressDontSendf59kuE']
};
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';import {useState} from 'react';
import {CryptoAddressForm} from './CryptoAddressForm';import {addNativeAddress} from './native-addresses';
function Fixture(){
 const [rows,setRows]=useState(()=>JSON.parse(localStorage.getItem('counterparties')||'[]'));
 window.saved=rows;
 const save=(next)=>{if(window.rejectSave)return false;localStorage.setItem('counterparties',JSON.stringify(next));setRows(next);return true;};
 return <main className="member-portfolio">
 <section id="external"><CryptoAddressForm id="external" counterparty ethereum solana bitcoin onAdd={(network,kind,name,address,out)=>{
   if(kind==='swap'){window.swapSelection={network,kind,name,address,out};return true;}
   const current=rows.filter(row=>row.network===network);
   const saveExchanges=next=>save([...rows.filter(row=>row.network!==network),...next.map(row=>({...row,network}))]);
   if(network==='cardano')return saveExchanges([...current,{address,name,dex:kind==='dex',out}]);
   return addNativeAddress({network,enabled:true,wallets:[],exchanges:current,saveWallets:()=>{throw Error('Must not create an owned wallet');},saveExchanges,balance:()=>undefined,usd:null},true,kind,name,address,out);
 }}/></section>
 <section id="owned"><CryptoAddressForm id="owned" ethereum solana bitcoin onAdd={()=>true}/></section>
 </main>;
}createRoot(document.getElementById('app')).render(<Fixture/>);`},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 const mount=async()=>{
  await page.goto('http://127.0.0.1:8997/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});await page.locator('#external-network').waitFor();
 };
 await mount();const form=page.locator('#external');
 assert.equal(await page.locator('#owned input[name="out_address"]').count(),0);
 for(const [network,values] of Object.entries(addresses)){
  await form.locator('#external-network').selectOption(network);
  const out=form.getByRole('checkbox',{name:'OUT address',exact:true});assert.equal(await out.isChecked(),true);
  for(const [index,address] of values.entries()){
   await out.setChecked(index===0);await form.locator('#external-name').fill(network+' '+index);await form.locator('#external-address').fill(address);
   if(index===0){
    await page.evaluate(()=>{window.rejectSave=true;});await form.getByRole('button',{name:'Add',exact:true}).click();
    await form.getByRole('alert').waitFor();assert.equal(await form.locator('#external-address').inputValue(),address);
    assert.equal(await page.evaluate(network=>window.saved.filter(row=>row.network===network).length,network),0);
    await page.evaluate(()=>{window.rejectSave=false;});
   }
   await form.getByRole('button',{name:'Add',exact:true}).click();
   assert.deepEqual(await page.evaluate(({network,address})=>{const row=window.saved.find(row=>row.network===network&&row.address===address);return {address:row.address,out:row.out,group:row.group,deposit:row.deposit};},{network,address}),{address,out:index===0,group:undefined,deposit:undefined});
  }
 }
 await form.locator('#external-network').selectOption('ethereum');await form.locator('#external-type').selectOption('swap');
 assert.equal(await form.getByRole('checkbox',{name:'OUT address',exact:true}).count(),0);
 await form.locator('#external-name').fill('Swap');await form.locator('#external-address').fill('0x'+'c'.repeat(40));await form.getByRole('button',{name:'Add',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.swapSelection.out),undefined);
 await mount();assert.equal(await page.evaluate(()=>window.saved.length),8);
 for(const network of Object.keys(addresses))assert.deepEqual(await page.evaluate(network=>window.saved.filter(row=>row.network===network).map(row=>row.out),network),[true,false]);
 for(const width of [1200,390,320]){
  await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await form.screenshot({path:'/tmp/portfolio-out-form-'+width+'.png'});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: standalone OUT CEX creation for ADA/ETH/SOL/BTC, explicit true/false persistence, failed saves, no owned-wallet creation, Swap isolation and responsive form.');
}finally{await browser.close();}
