import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{base58}=require('@scure/base'),{chromium}=await import(process.argv[2]);
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',own=base58.encode(new Uint8Array(32).fill(1)),cex=base58.encode(new Uint8Array(32).fill(2)),receipt=base58.encode(new Uint8Array(64).fill(3)),failed=base58.encode(new Uint8Array(64).fill(4));
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import Home from './App';const root=createRoot(document.getElementById('app'));let version=0;window.reopen=(role='admin')=>root.render(<Home key={++version} memberStake="${stake}" role={role}/>);window.reopen();`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx')},plugins:[{name:'native-fixtures',setup(build){
  build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
  build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
  build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace("[notice,setNotice]=useState('')","[notice,setNotice]=useState('Token prices or images could not be refreshed. Saved data and transaction analysis are retained.')").replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),requests=[],errors=[];
 let unavailable=false,receiptUnavailable=true,limitedSignatures=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const operation=new URL(route.request().url()).pathname.split('/').pop();let result;
  if(operation==='solana'){
   const body=route.request().postDataJSON();requests.push(body);
   if(unavailable)return route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Solana data unavailable. Saved data is retained.'})});
   if(body.action==='signatures'&&limitedSignatures-->0)return route.fulfill({status:429,contentType:'application/json',headers:{'Retry-After':'120'},body:JSON.stringify({error:'Helius rate limit reached. Retry shortly.',code:'provider_cooldown',retryAfter:120})});
   if(receiptUnavailable&&body.signature===receipt)return route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Solana data unavailable. Saved data is retained.'})});
   if(body.action==='signatures')result={signatures:body.until?[]:[failed,receipt],more:false};
   if(body.action==='balance')result={raw:'1950000000',slot:3};
   if(body.action==='transaction')result={transaction:{hash:body.signature,slot:body.signature===receipt?1:2,time:1672963200,payer:body.signature===receipt?cex:own,feeRaw:body.signature===receipt?'5000':'50000000',failed:body.signature===failed,transfers:body.signature===receipt?[{from:cex,to:own,raw:'2000000000'}]:[]}};
  }else if(operation==='historical-sol-prices')result={prices:[[Date.parse('2023-01-06'),50]]};
  else if(operation==='solana-price')result={usd:100};
  else if(operation==='ethereum')return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Ethereum refresh failed. Saved data is retained.'})});
  else if(operation==='ethereum-price')result={usd:2000};
  else if(operation==='price')result={cardano:{usd:0.5}};
  if(result)return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  return route.fulfill({contentType:'text/html',body:'<header><span id="portfolio-refresh-action"></span></header><div id="app"></div>'});
 });
 await page.goto('http://127.0.0.1:8998/');
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addScriptTag({content:await readFile('vendor/chart.js','utf8')});
 await page.evaluate(({stake,own,cex})=>{
  window.TDSPCharts={load:async()=>window.Chart};
  const settings=new Map([
   ['tdsp-member-solana-wallets:'+stake,JSON.stringify([{address:own,name:'SOL Savings'}])],
   ['tdsp-member-solana-cex:'+stake,JSON.stringify([{address:cex,name:'SOL Exchange'}])],
   ['tdsp-member-ethereum-wallets:'+stake,JSON.stringify([{address:'0x'+'a'.repeat(40),name:'ETH Savings'}])]
  ]);
  window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()]};
  window.fixture={groups:{},infos:[{address:'wallet',balance:'100000000',utxo_set:[{tx_hash:'holding',tx_index:0,value:'100000000',asset_list:[]}]}],facts:{},txs:[],markets:{},adaUsd:0.5,history:{'2023-01-06':0.5},complete:true};
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=()=>options.closeOverlay?.();overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 },{stake,own,cex});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 await page.getByRole('alert').filter({hasText:'Solana data unavailable.'}).waitFor();
 const interrupted=await page.evaluate(stake=>JSON.parse(window.fixtureStorage.getItem('tdsp-member-solana-data:'+stake)),stake);
 assert.equal(interrupted.pending.length,1,'completed receipt retained after a later upstream failure');
 assert.equal(Object.keys(interrupted.accounts).length,0,'incomplete history is not published as complete');
 for(const width of [1200,390,320]){
  await page.setViewportSize({width,height:900});
  for(const text of ['Token prices or images could not be refreshed.','Solana data unavailable.']){
   const typography=await page.getByText(text,{exact:false}).first().evaluate(el=>{
    const reference=document.createElement('p');reference.className=el.getAttribute('role')==='alert'?'small-text error-text':'small-text';document.body.append(reference);
    const actual=getComputedStyle(el),standard=getComputedStyle(reference);const result={size:actual.fontSize,expected:standard.fontSize,line:actual.lineHeight,expectedLine:standard.lineHeight,color:actual.color,expectedColor:standard.color,fits:el.scrollWidth<=el.clientWidth+1};reference.remove();return result;
   });
   assert.equal(typography.size,typography.expected);assert.equal(typography.line,typography.expectedLine);assert.equal(typography.color,typography.expectedColor);assert.ok(typography.fits);
  }
 }
 receiptUnavailable=false;await page.evaluate(()=>window.reopen());
 try{await page.waitForFunction(stake=>JSON.parse(window.fixtureStorage.getItem('tdsp-member-solana-data:'+stake)||'null')?.usd===100,stake);}catch(error){console.log({errors,requests,text:await page.locator('body').innerText()});throw error;}
 const completedRequests=requests.filter(r=>r.action==='transaction').length;
 assert.equal(requests.filter(r=>r.signature===failed).length,1,'pending receipt reused after reopening');
 assert.equal(requests.filter(r=>r.signature===receipt).length,4,'temporary failures have two retries before resuming');
 await page.getByRole('button',{name:'Open Wallets',exact:true}).click();
 await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();
 await page.getByRole('heading',{name:'Solana Wallets',exact:true}).waitFor();
 await page.getByRole('button',{name:'Refresh Solana wallets',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('button')&&true);
 await page.waitForFunction(()=>window.fixtureStorage.keys().some(key=>key.startsWith('tdsp-member-solana-data:')));
 await page.waitForTimeout(200);
 assert.ok(requests.some(r=>r.action==='signatures'&&r.until===failed),'refresh resumes after saved finalized signature');
 assert.equal(requests.filter(r=>r.action==='transaction').length,completedRequests,'cached details never refetched');
 limitedSignatures=1;
 await page.evaluate(()=>{window.retryDelays=[];window.originalTimeout=window.setTimeout;window.setTimeout=(callback,delay,...args)=>{if(delay===120000){window.retryDelays.push(delay);return window.originalTimeout(callback,1,...args);}return window.originalTimeout(callback,delay,...args);};});
 const signaturesBefore=requests.filter(r=>r.action==='signatures').length;
 await page.getByRole('button',{name:'Refresh Solana wallets',exact:true}).click();
 await page.waitForFunction(()=>window.retryDelays.includes(120000));
 await page.getByRole('button',{name:'Refresh Solana wallets',exact:true}).isEnabled();
 await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Refresh Solana wallets')?.disabled);
 assert.equal(requests.filter(r=>r.action==='signatures').length,signaturesBefore+2,'retry resumes after the provider cooldown');
 await page.evaluate(()=>{window.setTimeout=window.originalTimeout;});
 const cached=await page.evaluate(stake=>window.fixtureStorage.getItem('tdsp-member-solana-data:'+stake),stake);
 unavailable=true;await page.getByRole('button',{name:'Refresh Solana wallets',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Solana data unavailable.'}).waitFor();
 assert.equal(await page.evaluate(stake=>window.fixtureStorage.getItem('tdsp-member-solana-data:'+stake),stake),cached);
 for(const width of [1200,390]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>window.reopen());
  await page.getByRole('button',{name:'Open CEX Transactions',exact:true}).click();
  const table=page.locator('table').filter({has:page.getByRole('columnheader',{name:'SOL IN',exact:true})});
  await table.waitFor();assert.match(await table.innerText(),/2 SOL/);assert.match(await table.innerText(),/100\.00/);
  const rows=page.locator('#portfolio-gain-loss-overlay .history-table tbody tr');
  assert.equal(await rows.count(),1,'failed transaction is not a CEX transfer');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:`/tmp/tdsp-solana-${width}.png`,fullPage:true});
 }
 const count=requests.length;await page.evaluate(()=>window.reopen('delegator'));
 await page.getByRole('button',{name:'Open Wallets',exact:true}).click();await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();
 assert.equal(await page.getByRole('heading',{name:'Solana Wallets',exact:true}).count(),0);
 assert.equal(await page.getByRole('heading',{name:'Ethereum Wallets',exact:true}).count(),0);
 assert.equal(requests.length,count,'delegators do not request ETH or SOL even with saved wallets');
 assert.ok(await page.evaluate(stake=>!!window.fixtureStorage.getItem('tdsp-member-solana-data:'+stake),stake),'admin data retained, not deleted');
 assert.deepEqual(errors,[]);
 console.log('PASS: admin-only native wallets, SOL CEX totals and fees, incremental encrypted cache, retention on failure, desktop/mobile.');
}finally{await browser.close();}
