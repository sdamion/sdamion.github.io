import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const address='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',exchange='1BitcoinEaterAddressDontSendf59kuE',tip='a'.repeat(64);
const receipt={hash:'1'.repeat(64),height:1,time:1700000000,feeRaw:'100',inputs:[{address:exchange,raw:'1000'}],outputs:[{address,raw:'900'}]};
const send={hash:'2'.repeat(64),height:2,time:1700000010,feeRaw:'100',inputs:[{address,raw:'900'}],outputs:[{address:exchange,raw:'400'},{address,raw:'400'}]};
const latest={hash:'3'.repeat(64),height:2,time:1700000020,feeRaw:'100',inputs:[{address:exchange,raw:'200'}],outputs:[{address,raw:'100'}]};
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`import {createRoot} from 'react-dom/client';import Home from './App';createRoot(document.getElementById('app')).render(<Home memberStake="${stake}" role="admin"/>);`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){
  build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
  build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
  build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){setInitialising(false);setStatus("Ready");return;')}));
}}]});

const browser=await chromium.launch({channel:'chrome',headless:true});
let releasePage=()=>{};
try{
  const page=await browser.newPage(),errors=[];
  const pausedPage=new Promise(resolve=>{releasePage=resolve;});
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const operation=new URL(route.request().url()).pathname.split('/').pop();let result;
    if(operation==='bitcoin'){
      const body=route.request().postDataJSON();
      if(body.action==='tip')result={hash:tip,height:2};
      else if(body.action==='block-status')result={inBestChain:true};
      else if(body.action==='address')result={address:body.address,count:3,raw:'500'};
      else if(body.after){await pausedPage;result={transactions:[send],more:false};}
      else result={transactions:[latest],more:true};
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
  await page.evaluate(({stake,address,exchange,tip,receipt,send})=>{
    const settings=new Map([
      ['tdsp-member-bitcoin-wallets:'+stake,JSON.stringify([{address,name:'Own BTC'}])],
      ['tdsp-member-bitcoin-cex:'+stake,JSON.stringify([{address:exchange,name:'CEX',out:true,in:true}])],
      ['tdsp-member-bitcoin-data:'+stake,JSON.stringify({accounts:{[address]:{raw:'400',tip,transactions:[receipt,send]}},history:{},usd:100000})]
    ]);
    window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()],setItems:(values,remove=[])=>{for(const key of remove)settings.delete(key);for(const [key,value]of Object.entries(values))settings.set(key,value);}};
    window.fixture={groups:{},infos:[],facts:{},txs:[],markets:{},adaUsd:1,history:{},complete:true};
    window.TDSPCharts={load:async()=>window.Chart};
    window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
  },{stake,address,exchange,tip,receipt,send});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  const tile=page.getByRole('button',{name:'Open Transactions',exact:true});
  await page.waitForFunction(()=>document.querySelector('[aria-label="Open Transactions"] [role="progressbar"]')?.getAttribute('aria-valuetext')?.startsWith('3 analysed'));
  assert.match(await tile.innerText(),/3[\s\S]*Transactions/,'the tile keeps cached receipts while the next page is loading');
  await tile.click();
  const table=page.locator('#portfolio-transactions-overlay .history-table');
  for(const tx of [receipt,send,latest])await table.locator(`a[href="https://blockstream.info/tx/${tx.hash}"]`).waitFor();
  assert.equal(await table.locator('tbody tr').count(),3,'cached and newly verified BTC receipts remain visible during refresh');
  releasePage();
  await page.waitForFunction(stake=>JSON.parse(window.fixtureStorage.getItem('tdsp-member-bitcoin-data:'+stake)).accounts['1BoatSLRHtKNngkdXEeobR76b53LETtpyT'].parts===1,stake);
  assert.deepEqual(errors,[]);
  console.log('PASS: Bitcoin transaction tile and overlay keep the cached baseline during a paginated refresh.');
}finally{releasePage();await browser.close();}
