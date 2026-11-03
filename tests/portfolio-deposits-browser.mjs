import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{base58}=require('@scure/base'),{chromium}=await import(process.argv[2]||'playwright');
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const addresses={cardano:'addr1q99u68080mhnj34s78e5f2jwgarl342aj70jkleffze93k4l7csm4qlkawkyf9j34kh7sljq8d0mqn8kjypxrs38g78qqvfkfn',ethereum:'0x'+'b'.repeat(40),solana:base58.encode(new Uint8Array(32).fill(3)),bitcoin:'1BoatSLRHtKNngkdXEeobR76b53LETtpyT'};
const senders={ethereum:'0x'+'c'.repeat(40),solana:base58.encode(new Uint8Array(32).fill(4)),bitcoin:'1BitcoinEaterAddressDontSendf59kuE'};
const hashes={cardano:'a'.repeat(64),ethereum:'0x'+'b'.repeat(64),solana:base58.encode(new Uint8Array(64).fill(5)),bitcoin:'c'.repeat(64)};
const sweeps={cardano:'d'.repeat(64),ethereum:'0x'+'e'.repeat(64),solana:base58.encode(new Uint8Array(64).fill(6)),bitcoin:'f'.repeat(64)};
const btc=[{hash:hashes.bitcoin,height:1,time:1700000000,feeRaw:'1000',inputs:[{address:senders.bitcoin,raw:'100000000'}],outputs:[{address:addresses.bitcoin,raw:'99999000'}]},{hash:sweeps.bitcoin,height:2,time:1700000010,feeRaw:'1000',inputs:[{address:addresses.bitcoin,raw:'99999000'}],outputs:[{address:senders.bitcoin,raw:'40000000'},{address:addresses.bitcoin,raw:'59998000'}]}];
const pendingBtc={hash:'7'.repeat(64),height:2,time:1700000020,feeRaw:'1000',inputs:[{address:senders.bitcoin,raw:'50001000'}],outputs:[{address:addresses.bitcoin,raw:'50000000'}]};
const pendingEth={id:'0x'+'7'.repeat(64)+':normal',hash:'0x'+'7'.repeat(64),kind:'normal',block:3,time:1700000020,from:senders.ethereum,to:addresses.ethereum,valueWei:'500000000000000000',feeWei:'1000',failed:false};
const boundaryEth={...pendingEth,id:'0x'+'8'.repeat(64)+':normal',hash:'0x'+'8'.repeat(64),block:4,to:senders.ethereum};
const pendingSol={hash:base58.encode(new Uint8Array(64).fill(7)),slot:3,time:1700000020,payer:senders.solana,feeRaw:'5000',failed:false,transfers:[{from:senders.solana,to:addresses.solana,raw:'500000000'}]};
const failedSolHash=base58.encode(new Uint8Array(64).fill(8));
const eth=[{id:hashes.ethereum+':normal',hash:hashes.ethereum,kind:'normal',block:1,time:1700000000,from:senders.ethereum,to:addresses.ethereum,valueWei:'1234567890123456789',feeWei:'123456',failed:false},{id:sweeps.ethereum+':normal',hash:sweeps.ethereum,kind:'normal',block:2,time:1700000010,from:addresses.ethereum,to:senders.ethereum,valueWei:'1000000000000000000',feeWei:'123456',failed:false}];
const sol=[{hash:hashes.solana,slot:1,time:1700000000,payer:senders.solana,feeRaw:'5000',failed:false,transfers:[{from:senders.solana,to:addresses.solana,raw:'1234567891'}]},{hash:sweeps.solana,slot:2,time:1700000010,payer:addresses.solana,feeRaw:'5000',failed:false,transfers:[{from:addresses.solana,to:senders.solana,raw:'400000000'}]}];
const ada=[{tx_hash:hashes.cardano,tx_timestamp:1700000000,fee:'123',inputs:[{value:'123456912',payment_addr:{bech32:'addr1shared'}}],outputs:[{value:'123456789',payment_addr:{bech32:addresses.cardano}}]},{tx_hash:sweeps.cardano,tx_timestamp:1700000010,fee:'123',inputs:[{value:'123456789',payment_addr:{bech32:addresses.cardano}}],outputs:[{value:'123456666',payment_addr:{bech32:'addr1shared'}}]}];
const pendingAda={...ada[0],tx_hash:'8'.repeat(64),tx_timestamp:1700000020},failedAda={...ada[0],tx_hash:'9'.repeat(64),tx_timestamp:1700000030};
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`import {createRoot} from 'react-dom/client';import Home from './App';const root=createRoot(document.getElementById('app'));let n=0;window.reopen=(role='admin')=>root.render(<Home key={++n} memberStake="${stake}" role={role}/>);window.reopen();`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){
 build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
 build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
 build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){setInitialising(false);setStatus("Ready");return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[],requests=[];let unavailable=false,partialBtc=false,partialAda=false,partialEth=false,partialSol=false;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()),op=url.pathname.split('/').pop();
  if(url.pathname.endsWith('.toml'))return route.fulfill({contentType:'text/plain',body:await readFile('.'+url.pathname,'utf8')});
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
  if(['bitcoin','ethereum','solana','cardano'].includes(op)){
   const body=route.request().postDataJSON();requests.push({network:op,...body});
   if(unavailable)return route.fulfill({status:400,json:{error:'Synthetic unavailable'}});
   if(op==='bitcoin'&&partialBtc&&body.action==='history'){
    if(body.after)return route.fulfill({status:503,json:{error:'Synthetic later Bitcoin page failed.'}});
    return route.fulfill({json:{transactions:[pendingBtc],more:true}});
   }
   if(op==='ethereum'&&partialEth&&body.action==='history'&&body.kind==='normal'){
    if(body.page>1)return route.fulfill({status:503,json:{error:'Synthetic later Ethereum page failed.'}});
    return route.fulfill({json:{transactions:[pendingEth,boundaryEth],more:true,provider:'etherscan'}});
   }
   if(op==='solana'&&partialSol&&body.action==='transaction'&&body.signature===failedSolHash)return route.fulfill({status:400,json:{error:'Synthetic later Solana transaction failed.'}});
   let result;
   if(op==='bitcoin')result=body.action==='tip'?{hash:'1'.repeat(64),height:2}:body.action==='block-status'?{inBestChain:true}:body.action==='address'?{address:body.address,count:2,raw:'59998000'}:{transactions:[...btc].reverse(),more:false};
   if(op==='ethereum')result=body.action==='head'?{block:partialEth?4:2,finalizedBlock:partialEth?4:2,provider:'etherscan'}:body.action==='balance'?{balanceWei:'999999999999999999999',provider:'etherscan'}:{transactions:body.kind==='internal'?[]:eth.filter(tx=>tx.block>=body.startBlock&&tx.block<=body.endBlock),more:false,provider:'etherscan'};
   if(op==='solana')result=body.action==='signatures'?{signatures:partialSol?[pendingSol.hash,failedSolHash]:body.until?[]:[sweeps.solana,hashes.solana],more:false}:body.action==='balance'?{raw:'835562891',slot:2}:{transaction:partialSol&&body.signature===pendingSol.hash?pendingSol:sol.find(tx=>tx.hash===body.signature)};
   if(op==='cardano'){
    const history=partialAda?[...ada,pendingAda,failedAda]:ada;
    result=body.path==='address_txs'?history.map((tx,index)=>({tx_hash:tx.tx_hash,block_time:tx.tx_timestamp,block_height:index+1})):body.path==='tx_info'?history.filter(tx=>body.body._tx_hashes.includes(tx.tx_hash)&&tx.tx_hash!==failedAda.tx_hash):[];
   }
   return route.fulfill({json:result});
  }
  if(op.startsWith('historical-'))return route.fulfill({json:{prices:[[1700000000000,100]]}});
  if(op.endsWith('-price'))return route.fulfill({json:{usd:100}});
  if(op==='price')return route.fulfill({json:{cardano:{usd:1}}});
  return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="portfolio-refresh-action"></div><div id="app"></div>'});
 });
 await page.goto('http://127.0.0.1:8997/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.evaluate(({stake,addresses})=>{
  const settings=new Map(Object.entries(addresses).map(([network,address])=>[(network==='cardano'?'tdsp-member-cex-v1:':'tdsp-member-'+network+'-cex:')+stake,JSON.stringify([{address,name:network+' deposit',out:true}])]));
  window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()],setItems:(values,remove=[])=>{for(const key of remove)settings.delete(key);for(const [key,value]of Object.entries(values))settings.set(key,value);}};
  window.fixture={groups:{[stake]:[]},infos:[],facts:{},txs:[],markets:{},adaUsd:1,history:{'2023-11-14':1},complete:true};
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 },{stake,addresses});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});await page.getByRole('button',{name:'Open Wallets',exact:true}).waitFor();
 assert.equal(requests.length,0,'OUT labels alone never scan an exchange');
 const openAddresses=async()=>{await page.getByRole('button',{name:'Open Wallets',exact:true}).click();await page.getByRole('button',{name:'Open DEX / CEX & Swap',exact:true}).click();};
 const closeAddresses=async()=>{await page.locator('#portfolio-wallet-menu-exchanges').getByRole('button',{name:'Back',exact:true}).click();await page.locator('#portfolio-wallets-overlay').getByRole('button',{name:'Back',exact:true}).click();};
 await openAddresses();
 for(const network of Object.keys(addresses)){
  await page.getByRole('button',{name:'Actions for '+network+' deposit',exact:true}).click();await page.getByRole('menuitem',{name:'Track deposits to this address',exact:true}).click();
  await page.waitForFunction(({stake,network,address})=>{const value=JSON.parse(window.fixtureStorage.getItem((network==='cardano'?'tdsp-member-cardano-deposits:':'tdsp-member-'+network+'-data:')+stake)||'null');return network==='cardano'?value?.parts>0:!!value?.accounts?.[address];},{stake,network,address:addresses[network]});
 }
 await closeAddresses();await page.getByRole('button',{name:'Open Transactions',exact:true}).click();const transactions=page.locator('#portfolio-transactions-overlay');
 await transactions.getByText('Direct CEX deposit',{exact:true}).nth(3).waitFor();assert.equal(await transactions.locator('tbody tr').count(),4);
 for(const hash of Object.values(hashes))assert.equal(await transactions.locator(`a[href$="/${hash}"]`).count(),1);
 for(const hash of Object.values(sweeps))assert.equal(await transactions.locator(`a[href$="/${hash}"]`).count(),0,'exchange sweeps remain hidden');
 for(const amount of ['123.456789 ADA','1.234567890123456789 ETH','1.234567891 SOL','0.99999 BTC'])assert.equal(await transactions.getByText(amount,{exact:true}).count(),1);
 for(const row of await transactions.locator('tbody tr').all()){assert.match(await row.locator('td').nth(2).innerText(),/0 (ADA|ETH|SOL|BTC)/);assert.match(await row.locator('td').nth(3).innerText(),/External receipt/);}
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await transactions.screenshot({path:'/tmp/portfolio-deposits-'+width+'.png'});}
 await transactions.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Open CEX Transactions',exact:true}).click();const cex=page.locator('#portfolio-gain-loss-overlay');
 for(const symbol of ['ADA','ETH','SOL','BTC']){await cex.getByRole('button',{name:symbol+' IN',exact:true}).click();assert.equal(await cex.locator('.history-table tbody tr').count(),1);await cex.getByRole('button',{name:symbol+' OUT',exact:true}).click();assert.equal(await cex.locator('.history-table tbody tr').count(),0);}
 assert.equal(await page.evaluate(({stake})=>['ethereum','solana','bitcoin'].some(network=>JSON.parse(window.fixtureStorage.getItem('tdsp-member-'+network+'-wallets:'+stake)||'[]').length>0),{stake}),false,'CEX scans do not create owned wallets');
 await cex.getByRole('button',{name:'Back',exact:true}).click();partialBtc=true;partialAda=true;partialEth=true;partialSol=true;
 await page.getByRole('button',{name:'Portfolio not syncing. Refresh Portfolio',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Cardano CEX deposits partially loaded.'}).waitFor();
 await page.getByRole('alert').filter({hasText:'Synthetic later Bitcoin page failed.'}).waitFor();
 await page.getByRole('alert').filter({hasText:'Synthetic later Ethereum page failed.'}).waitFor();
 await page.getByRole('alert').filter({hasText:'Synthetic later Solana transaction failed.'}).waitFor();
 await page.getByRole('button',{name:'Open CEX Transactions',exact:true}).click();
 for(const [symbol,hash] of [['ADA',pendingAda.tx_hash],['BTC',pendingBtc.hash],['ETH',pendingEth.hash],['SOL',pendingSol.hash]]){
  await cex.getByRole('button',{name:symbol+' IN',exact:true}).click();
  const row=cex.locator('tbody tr').filter({has:page.locator(`a[href$="/${hash}"]`)});
  await row.waitFor();assert.match(await row.innerText(),/Partial history/);
  assert.equal(await cex.locator('.history-table tbody tr').count(),2,symbol+' IN rows');
 }
 assert.equal(await page.evaluate(stake=>JSON.parse(window.fixtureStorage.getItem('tdsp-member-bitcoin-data:'+stake)).pendingParts,stake),1,'verified pending BTC rows survive encrypted cache reload');
 assert.equal(await page.evaluate(stake=>JSON.parse(window.fixtureStorage.getItem('tdsp-member-cardano-deposits:'+stake)).complete,stake),false);
 await cex.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Open Needs review',exact:true}).click();const review=page.locator('#portfolio-review-overlay');
 for(const hash of [pendingAda.tx_hash,pendingBtc.hash,pendingEth.hash,pendingSol.hash]){await review.locator(`a[href$="/${hash}"]`).waitFor();assert.equal(await review.locator(`a[href$="/${hash}"]`).count(),1,`incomplete transaction ${hash} stays inspectable`);}
 assert.equal(await review.locator('.history-table tbody tr').count(),5,'review overlay lists incomplete Cardano scan rows and pending native rows');
 for(const network of ['Cardano','Ethereum','Solana','Bitcoin'])assert.equal(await review.getByRole('button',{name:`Retry ${network} scan`,exact:true}).count(),1);
 assert.equal(await review.getByRole('button',{name:'Review wallet addresses',exact:true}).count(),1);
 await review.getByRole('button',{name:'Back',exact:true}).click();
 unavailable=true;await page.evaluate(()=>window.reopen());
 await page.getByRole('button',{name:'Portfolio not syncing. Refresh Portfolio',exact:true}).waitFor();await page.getByRole('button',{name:'Portfolio not syncing. Refresh Portfolio',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Cardano CEX deposits partially loaded.'}).waitFor();
 await page.getByRole('button',{name:'Open Transactions',exact:true}).click();await transactions.getByText('Direct CEX deposit',{exact:true}).nth(7).waitFor();assert.equal(await transactions.locator('tbody tr').count(),8,'validated partial rows survive provider failure and reload');
 await transactions.getByRole('button',{name:'Back',exact:true}).click();
 const beforeRole=requests.length;await page.evaluate(()=>window.reopen('delegator'));await page.getByRole('button',{name:'Open Transactions',exact:true}).click();
 await transactions.getByText('123.456789 ADA',{exact:true}).first().waitFor();assert.equal(await transactions.locator('tbody tr').count(),2,'native deposit history remains access-gated');
 assert.equal(requests.slice(beforeRole).some(request=>request.network!=='cardano'),false,'revoked native access never scans cached watched addresses');
 await page.evaluate(()=>window.reopen());await page.getByRole('button',{name:'Portfolio not syncing. Refresh Portfolio',exact:true}).waitFor();await page.getByRole('button',{name:'Open Wallets',exact:true}).click();await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();
 for(const network of Object.keys(addresses)){await page.getByRole('button',{name:'Actions for '+network+' deposit',exact:true}).click();await page.getByRole('menuitem',{name:'Stop tracking deposits',exact:true}).click();}
 await page.locator('#portfolio-wallet-menu-wallets').getByRole('button',{name:'Back',exact:true}).click();await page.locator('#portfolio-wallets-overlay').getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Open Transactions',exact:true}).click();assert.equal(await transactions.locator('tbody tr').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: all four chains opt in through the shared CEX menu, discover external deposits without owned wallets, retain exact amounts/fees and cached history, hide sweeps, filter IN/OUT and stop tracking.');
}finally{await browser.close();}
