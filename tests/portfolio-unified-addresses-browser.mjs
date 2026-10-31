import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{base58}=require('@scure/base');
const {chromium}=await import(process.argv[2]||'playwright');
const eth='0x'+'2'.repeat(40),sol=base58.encode(new Uint8Array(32).fill(2));
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {CryptoAddressForm} from './CryptoAddressForm';
import {EthereumWallets} from './EthereumWallets';
import {SolanaWallets} from './SolanaWallets';
import {CexAddresses} from './CexAddresses';
import {ethereumWallets,emptyEthereum} from './ethereum';
import {nativeWallets,emptySolana} from './solana';
function Fixture(){
 const [entries,setEntries]=useState(()=>JSON.parse(localStorage.getItem('ada')||'[]'));
 const [eth,setEth]=useState(()=>ethereumWallets(JSON.parse(localStorage.getItem('eth')||'[]')));
 const [sol,setSol]=useState(()=>nativeWallets(JSON.parse(localStorage.getItem('sol')||'[]')));
 const [own,setOwn]=useState([]);
 const save=(key,set)=>(next)=>{if(window.rejectSave)return false;localStorage.setItem(key,JSON.stringify(next));set(next);return true;};
 window.saved={ada:entries,eth,sol,own};
 return <main className="member-portfolio">
 <section id="own"><CryptoAddressForm id="own" ethereum solana onAdd={(network,kind,name,address)=>{setOwn([...own,{network,name,address}]);return true;}}/></section>
 <section id="counterparty"><CryptoAddressForm id="external" counterparty ethereum solana onAdd={(network,kind,name,address)=>{
   if(network==='cardano')return save('ada',setEntries)([...entries,{address,name,miner:true}]);
   const rows=network==='ethereum'?eth:sol;
   return save(network==='ethereum'?'eth':'sol',network==='ethereum'?setEth:setSol)([...rows,{address,name,miner:true,...(kind==='dex'?{dex:true}:{})}]);
 }}/>
 <CexAddresses showForm={false} entries={entries} owned={[]} onChange={save('ada',setEntries)}/>
 <EthereumWallets showForm={false} exchanges wallets={eth} data={emptyEthereum()} onChange={save('eth',setEth)}/>
 <SolanaWallets showForm={false} exchanges wallets={sol} owned={[]} data={emptySolana()} onChange={save('sol',setSol)}/>
 </section>
 <section id="restricted"><CryptoAddressForm id="restricted" onAdd={()=>true}/></section>
 </main>;
}
createRoot(document.getElementById('app')).render(<Fixture/>);
`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/components/ui/table':path.join(source,'ui.tsx')}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 const mount=async()=>{await page.goto('http://127.0.0.1:8997/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});};
 await mount();
 const external=page.locator('#counterparty');
 await external.locator('#external-network').waitFor();
 assert.equal(await external.locator('[name="service_address"]').count(),1);
 assert.equal(await page.locator('#own [name="service_address"]').count(),1);
 assert.equal(await page.locator('#restricted select option').count(),1,'disabled chains are not offered');
 for(const [network,address] of [['cardano',stake],['ethereum',eth],['solana',sol]]){
   await external.locator('#external-network').selectOption(network);
   await external.locator('#external-type').selectOption(network==='cardano'?'exchange':'dex');
   await external.locator('#external-name').fill('Exchange '+network);
   await external.locator('#external-address').fill('invalid');
   await external.getByRole('button',{name:'Add',exact:true}).click();
   await external.getByRole('alert').waitFor();
   await external.locator('#external-address').fill(network==='ethereum'?address.toUpperCase():address);
   await external.getByRole('button',{name:'Add',exact:true}).click();
   const row=external.locator('tbody tr').filter({has:page.locator('a[title="'+address+'"]')});
   await row.waitFor();
   await row.getByRole('textbox',{name:'Exchange name',exact:true}).fill('Renamed '+network);
   await page.evaluate(()=>{window.rejectSave=true;});
   await row.getByRole('button',{name:'Save name',exact:true}).click();
   await external.getByRole('status').or(external.getByRole('alert')).filter({hasText:'Could not save the selection.'}).waitFor();
   const key=network==='cardano'?'ada':network==='ethereum'?'eth':'sol';
   assert.equal(await page.evaluate(key=>window.saved[key][0].name,key),'Exchange '+network,'failed saves retain the previous saved name');
   await page.evaluate(()=>{window.rejectSave=false;});
   await row.getByRole('button',{name:'Save name',exact:true}).click();
   const saved=await page.evaluate(key=>window.saved[key][0],key);
   assert.equal(saved.name,'Renamed '+network);assert.equal(saved.address,address);assert.equal(saved.miner,true);
   if(network!=='cardano')assert.equal(saved.dex,true);
   assert.equal(await row.getByRole('button',{name:'Save name',exact:true}).isDisabled(),true);
 }
 assert.equal(await page.evaluate(()=>window.saved.own.length),0,'counterparties never enter owned holdings');
 await page.locator('#own-network').selectOption('solana');
 await page.locator('#own-name').fill('My SOL');await page.locator('#own-address').fill(sol);
 await page.locator('#own').getByRole('button',{name:'Add',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>window.saved.own),[{network:'solana',name:'My SOL',address:sol}]);
 await mount();
 for(const [key,address] of [['ada',stake],['eth',eth],['sol',sol]]){
   const row=page.locator('tbody tr').filter({has:page.locator('a[title="'+address+'"]')});
   await row.waitFor();assert.match(await row.getByRole('textbox',{name:'Exchange name',exact:true}).inputValue(),/^Renamed /);
   assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key))[0].address,key),address);
 }
 for(const width of [1200,390,320]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'forms and inline name editors fit');
   await page.screenshot({path:'/tmp/portfolio-unified-'+width+'.png'});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: shared single-field forms, per-network validation, access options, rename persistence, unchanged addresses/metadata, ownership separation and responsive layouts.');
}finally{await browser.close();}
