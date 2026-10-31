import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',address='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',exchange='1BitcoinEaterAddressDontSendf59kuE',tip='a'.repeat(64);
const receipt={hash:'1'.repeat(64),height:1,time:1700000000,feeRaw:'1000',inputs:[{address:exchange,raw:'100000000'}],outputs:[{address,raw:'99999000'}]};
const send={hash:'2'.repeat(64),height:2,time:1700000010,feeRaw:'1000',inputs:[{address,raw:'99999000'}],outputs:[{address:exchange,raw:'40000000'},{address,raw:'59998000'}]};
const future={hash:'3'.repeat(64),height:3,time:1700000020,feeRaw:'0',inputs:[{address:exchange,raw:'1000'}],outputs:[{address,raw:'1000'}]};
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`import {createRoot} from 'react-dom/client';import Home from './App';let version=0;const root=createRoot(document.getElementById('app'));window.reopen=(role='admin')=>root.render(<Home key={++version} memberStake="${stake}" role={role}/>);window.reopen();`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){
 build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
 build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
 build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){setInitialising(false);setStatus("Ready");return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[],requests=[];
 let unavailable=false,reorg=false,changedTip=false;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const operation=new URL(route.request().url()).pathname.split('/').pop();let result;
  if(operation==='bitcoin'){
   const body=route.request().postDataJSON();requests.push(body);
   if(unavailable)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Bitcoin data unavailable. Saved data is retained.'})});
   result=body.action==='tip'?{hash:changedTip?'b'.repeat(64):tip,height:2}:body.action==='block-status'?{inBestChain:body.hash==='b'.repeat(64)||!reorg}:body.action==='address'?{address:body.address,count:3,raw:'59999000'}:{transactions:[future,send,receipt],more:false};
  }else if(operation==='bitcoin-price')result={usd:100000};
  else if(operation==='historical-btc-prices')result={prices:[[1700000000000,100000]]};
  else if(operation==='price')result={cardano:{usd:1}};
  if(result)return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  return route.fulfill({contentType:'text/html',body:'<div id="portfolio-refresh-action"></div><div id="app"></div>'});
 });
 await page.goto('http://127.0.0.1:8997/');
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.addScriptTag({content:await readFile('vendor/chart.js','utf8')});
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.evaluate(()=>{
  const settings=new Map();window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()],setItems:(values,remove=[])=>{for(const key of remove)settings.delete(key);for(const [key,value]of Object.entries(values))settings.set(key,value);}};
  window.fixture={groups:{},infos:[],facts:{},txs:[],markets:{},adaUsd:1,history:{'2023-11-14':1},complete:true};
  window.TDSPCharts={load:async()=>window.Chart};
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 });
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const walletTile=page.getByRole('button',{name:'Open Wallets',exact:true});await walletTile.waitFor();
 await walletTile.click();await page.getByRole('button',{name:'Open DEX / CEX & Swap',exact:true}).click();
 const external=page.locator('#portfolio-wallet-menu-exchanges');
 await external.getByRole('combobox',{name:'Network',exact:true}).selectOption('bitcoin');
 await external.locator('#portfolio-exchange-name').fill('BTC Exchange');await external.locator('#portfolio-exchange-address').fill(exchange);
 await external.getByRole('button',{name:'Add',exact:true}).click();
 await external.getByRole('heading',{name:'Bitcoin CEX addresses',exact:true}).waitFor();
 assert.equal(requests.length,0,'CEX-only addresses never trigger blockchain scans');
 await external.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();
 const own=page.locator('#portfolio-wallet-menu-wallets');
 await own.getByRole('combobox',{name:'Network',exact:true}).selectOption('bitcoin');
 await own.locator('#portfolio-wallet-name').fill('BTC Savings');await own.locator('#portfolio-wallet-address').fill('not-a-wallet');await own.getByRole('button',{name:'Add',exact:true}).click();
 await own.getByRole('alert').filter({hasText:'Enter a valid Bitcoin mainnet address.'}).waitFor();
 await own.locator('#portfolio-wallet-address').fill(address);await own.getByRole('button',{name:'Add',exact:true}).click();
 await own.getByText('$59,998.00',{exact:true}).waitFor();
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 assert.ok(requests.filter(row=>row.address).every(row=>row.address===address));
 await own.getByRole('button',{name:'Back',exact:true}).click();await page.locator('#portfolio-wallets-overlay').getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Open Transactions',exact:true}).click();
 const transactions=page.locator('#portfolio-transactions-overlay');
 await transactions.locator('a[href="https://blockstream.info/tx/'+receipt.hash+'"]').waitFor();
 assert.equal(await transactions.locator('tbody tr').count(),2,'transactions confirmed above the shared anchor wait for the next refresh');
 await transactions.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Open CEX Transactions',exact:true}).click();
 const gain=page.locator('#portfolio-gain-loss-overlay');
 await gain.locator('.portfolio-btc-comparison').waitFor();assert.match(await gain.locator('.portfolio-btc-comparison').innerText(),/0.99999 BTC[\s\S]*0.4 BTC/);
 await gain.getByRole('button',{name:'BTC IN',exact:true}).click();assert.equal(await gain.locator('.history-table tbody tr').count(),1);
 await gain.getByRole('button',{name:'BTC OUT',exact:true}).click();assert.equal(await gain.locator('.history-table tbody tr').count(),1);
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'/tmp/portfolio-bitcoin-'+width+'.png'});}
 unavailable=true;await page.evaluate(()=>window.reopen());
 await page.getByRole('alert').filter({hasText:'Bitcoin data unavailable. Saved data is retained.'}).waitFor();
 assert.match(await page.getByRole('button',{name:'Open Assets',exact:true}).innerText(),/59,998/,'cached holdings survive provider failures');
 unavailable=false;reorg=true;changedTip=true;const start=requests.length;await page.evaluate(()=>window.reopen());
 await page.waitForFunction(stake=>JSON.parse(window.fixtureStorage.getItem('tdsp-member-bitcoin-data:'+stake)).accounts['1BoatSLRHtKNngkdXEeobR76b53LETtpyT'].tip==='b'.repeat(64),stake);
 assert.ok(requests.slice(start).some(row=>row.action==='history'),'orphaned saved tips cause a fresh scan');
 const count=requests.length;await page.evaluate(()=>window.reopen('delegator'));await walletTile.click();await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();
 assert.equal(await page.locator('#portfolio-wallet-network option[value="bitcoin"]').count(),0,'Bitcoin remains admin-only');
 assert.equal(requests.length,count);
 assert.deepEqual(errors,[]);
 console.log('PASS: full Portfolio BTC forms, validation, confirmed holdings, IN/OUT filters, cache retention, reorg scan, owned-only requests, access isolation and mobile layout.');
}finally{await browser.close();}
