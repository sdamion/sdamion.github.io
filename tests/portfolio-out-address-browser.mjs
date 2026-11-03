import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',own='0x'+'a'.repeat(40),target='0x'+'b'.repeat(40),pool='0x'+'c'.repeat(40);
const tx=(n,from,to)=>({id:'0x'+String(n).padStart(64,'0')+':normal',hash:'0x'+String(n).padStart(64,'0'),block:n,time:1700000000+n,kind:'normal',from,to,valueWei:'1234567890123456789',feeWei:'123456789123456',failed:false});
const receipt=tx(1,pool,target),outgoing=tx(2,own,target),sweep=tx(3,target,pool);
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`import {createRoot} from 'react-dom/client';import Home from './App';const root=createRoot(document.getElementById('root'));let n=0;window.reopen=()=>root.render(<Home key={++n} memberStake="${stake}" role="admin"/>);window.reopen();`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){
 build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
 build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
 build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){setStatus("Ready");return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()),op=url.pathname.split('/').pop();
  if(url.pathname.endsWith('.toml'))return route.fulfill({contentType:'text/plain',body:await readFile('.'+url.pathname,'utf8')});
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
  if(op==='ethereum'){
   const body=route.request().postDataJSON();
   if(body.action==='head')return route.fulfill({json:{block:1000,finalizedBlock:1000,provider:'etherscan'}});
   if(body.action==='balance')return route.fulfill({json:{balanceWei:body.address===target?'99000000000000000000':'1000000000000000000',provider:'etherscan'}});
   if(body.action==='history')return route.fulfill({json:{transactions:body.kind==='internal'?[]:[receipt,outgoing,sweep].filter(tx=>(tx.from===body.address||tx.to===body.address)&&tx.block>=body.startBlock&&tx.block<=body.endBlock),more:false,provider:'etherscan'}});
  }
  if(op==='historical-eth-prices')return route.fulfill({json:{prices:[[1700000000000,1000]]}});
  if(op==='ethereum-price')return route.fulfill({json:{usd:1000}});
  if(url.pathname.startsWith('/api/portfolio/'))return route.fulfill({status:503,json:{error:'Synthetic unavailable'}});
  return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="portfolio-refresh-action"></div><div id="root"></div>'});
 });
 await page.goto('http://127.0.0.1:8999/');await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.evaluate(({stake,own,target})=>{
  const settings=new Map([['tdsp-member-ethereum-wallets:'+stake,JSON.stringify([{address:own,name:'Ledger'}])],['tdsp-member-ethereum-cex:'+stake,JSON.stringify([{address:target,name:'My destination',out:false}])]]);window.settings=settings;window.stake=stake;
  window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()],setItems:(values,remove=[])=>{for(const key of remove)settings.delete(key);for(const [key,value]of Object.entries(values))settings.set(key,value);}};
  window.fixture={groups:{[stake]:[]},infos:[],facts:{},txs:[],markets:{},adaUsd:1,history:{'2023-11-14':1},complete:true};
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 },{stake,own,target});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 await page.waitForFunction(own=>JSON.parse(window.settings.get('tdsp-member-ethereum-data:'+window.stake)||'{}').accounts?.[own]?.transactions.length===1,own);
 const original=await page.evaluate(own=>JSON.parse(window.settings.get('tdsp-member-ethereum-data:'+window.stake)).accounts[own],own);
 async function addresses(){await page.getByRole('button',{name:'Open Wallets',exact:true}).click();await page.getByRole('button',{name:'Open DEX / CEX & Swap',exact:true}).click();}
 async function closeAddresses(){await page.locator('#portfolio-wallet-menu-exchanges').getByRole('button',{name:'Back',exact:true}).click();await page.locator('#portfolio-wallets-overlay').getByRole('button',{name:'Back',exact:true}).click();}
 async function personalAddresses(){await page.getByRole('button',{name:'Open Wallets',exact:true}).click();await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();}
 async function closePersonalAddresses(){await page.locator('#portfolio-wallet-menu-wallets').getByRole('button',{name:'Back',exact:true}).click();await page.locator('#portfolio-wallets-overlay').getByRole('button',{name:'Back',exact:true}).click();}
 await addresses();const out=page.getByRole('checkbox',{name:'OUT address: My destination',exact:true});assert.equal(await out.isChecked(),false);await out.check();
 assert.deepEqual(await page.evaluate(own=>JSON.parse(window.settings.get('tdsp-member-ethereum-data:'+window.stake)).accounts[own],own),original,'OUT selection cannot edit blockchain data');
 await page.getByRole('button',{name:'Actions for My destination',exact:true}).click();await page.getByRole('menuitem',{name:'Track deposits to this address',exact:true}).click();
 await page.waitForFunction(target=>JSON.parse(window.settings.get('tdsp-member-ethereum-data:'+window.stake)||'{}').accounts?.[target]?.balanceWei==='99000000000000000000',target);
 await closeAddresses();await page.getByRole('button',{name:'Open Transactions',exact:true}).click();const transactions=page.locator('#portfolio-transactions-overlay');
 await transactions.getByText('ETH OUT',{exact:true}).waitFor();await transactions.getByText('Direct CEX deposit',{exact:true}).waitFor();
 assert.equal(await transactions.locator('a[href="https://etherscan.io/tx/'+outgoing.hash+'"]').count(),1);assert.equal(await transactions.locator('a[href="https://etherscan.io/tx/'+receipt.hash+'"]').count(),1);assert.equal(await transactions.locator('a[href="https://etherscan.io/tx/'+sweep.hash+'"]').count(),0);
 assert.ok(await transactions.getByText('1.234567890123456789 ETH',{exact:true}).count()>0);assert.ok(await transactions.getByText('0.000123456789123456 ETH',{exact:true}).count()>0);assert.equal(await transactions.getByRole('button',{name:'Fiat exits',exact:true}).count(),0);
 await transactions.getByRole('button',{name:'Back',exact:true}).click();await personalAddresses();await out.uncheck();
 const sourceAfter=await page.evaluate(own=>JSON.parse(window.settings.get('tdsp-member-ethereum-data:'+window.stake)).accounts[own],own);assert.deepEqual(sourceAfter,original);
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('#portfolio-wallet-menu-wallets').screenshot({path:'/tmp/portfolio-out-address-'+width+'.png'});}
 for(const file of ['shared/portfolio-i18n-keys.js','shared/portfolio-i18n.js','shared/i18n.js'])await page.addScriptTag({content:await readFile(file,'utf8')});
 for(const language of ['nl','ja','es','en']){await page.evaluate(language=>window.TDSPI18n.setLanguage(language),language);const label=await page.evaluate(()=>window.TDSPI18n.translateText('OUT address: {name}').replace('{name}','My destination'));assert.equal(await page.getByRole('checkbox',{name:label,exact:true}).isChecked(),false);}
 await closePersonalAddresses();await page.getByRole('button',{name:'Open Transactions',exact:true}).click();assert.equal(await transactions.getByText('ETH OUT',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: user-chosen OUT addresses, opt-in deposit history, exact blockchain amounts/fees, unmodified provider balances, source-data immutability, no fiat edit fields, languages and responsive layout.');
}finally{await browser.close();}
