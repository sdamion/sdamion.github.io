import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',address='0x'+'a'.repeat(40),exchange='0x'+'b'.repeat(40),hash='0x'+'1'.repeat(64);
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import Home from './App';createRoot(document.getElementById('app')).render(<Home memberStake="${stake}"/>);`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'ethereum-fixture',setup(build){
  build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
  build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage; export const flushVault=async()=>{}; export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
  build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url()),operation=url.pathname.split('/').pop();
    let result;
    if(operation==='ethereum'){
      const body=route.request().postDataJSON();requests.push(body);
      result=body.action==='head'?{block:200}:body.action==='balance'?{balanceWei:'1000000000000000000'}:{transactions:body.kind==='normal'?[{id:hash+':normal',hash,kind:'normal',block:180,time:1672963200,from:exchange,to:address,valueWei:'1000000000000000000',feeWei:'210000000000000',failed:false}]:[],more:false};
    }else if(operation==='historical-eth-prices')result={prices:[[Date.parse('2023-01-06'),1000]]};
    else if(operation==='ethereum-price'){await new Promise(resolve=>setTimeout(resolve,100));result={usd:2000};}
    else if(operation==='price')result={cardano:{usd:0.5}};
    if(result)return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
    return route.fulfill({contentType:'text/html',body:'<header><span id="portfolio-refresh-action"></span></header><div id="app"></div>'});
  });
  await page.goto('http://127.0.0.1:8998/');
  await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.evaluate(({stake,address,exchange})=>{
    const settings=new Map([
      ['tdsp-member-cex-v1:'+stake,JSON.stringify([{address:'stake1uxllvgd6s0mwhtzyjeg6mtlg0eqrkhasfnmfzqnpcgn50rsmgdu7c',name:'Cardano CEX'}])],
      ['tdsp-member-ethereum-wallets:'+stake,JSON.stringify([])],
      ['tdsp-member-ethereum-cex:'+stake,JSON.stringify([{address:exchange,name:'Bitvavo'}])]
    ]);
    window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()]};
    window.fixture={groups:{},infos:[{address:'wallet',balance:'100000000',utxo_set:[{tx_hash:'holding',tx_index:0,value:'100000000',asset_list:[]}]}],facts:{cardano:{hash:'cardano',time:1672963200,adaRaw:'100000000',feeRaw:'0',internal:false,assets:{},decimals:{},wallets:[],swapCandidate:false,externalInputs:[{address:'stake1uxllvgd6s0mwhtzyjeg6mtlg0eqrkhasfnmfzqnpcgn50rsmgdu7c',lovelace:'100000000'}],externalOutputs:[]}},txs:[{tx_hash:'cardano',block_time:1672963200}],markets:{},adaUsd:0.5,history:{'2023-01-06':0.5},complete:true};
    window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
  },{stake,address,exchange});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  const assets=page.getByRole('button',{name:'Open Assets',exact:true}),cex=page.getByRole('button',{name:'Open CEX Transactions',exact:true});
  const walletsTile=page.getByRole('button',{name:'Open Wallets',exact:true});
  await walletsTile.waitFor();
  assert.equal(await page.getByRole('button',{name:'Open Ethereum Wallets',exact:true}).count(),0);
  assert.equal(requests.length,0,'a CEX-only setup never scans a shared exchange wallet');
  await cex.click();
  await page.locator('#portfolio-gain-loss-overlay').getByRole('button',{name:'Wallets',exact:true}).waitFor();
  assert.match(await page.locator('#portfolio-gain-loss-overlay').innerText(),/Add your own Ethereum wallet/);
  await page.locator('#portfolio-gain-loss-overlay').getByRole('button',{name:'Wallets',exact:true}).click();
  await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();
  const setup=page.locator('#portfolio-wallet-menu-wallets');
  await setup.locator('form').first().waitFor();
  assert.match(await setup.innerText(),/Add your own Ethereum wallet/);
  const ownForm=setup.locator('form').last();
  await ownForm.locator('input').nth(0).fill('ETH Savings');await ownForm.locator('input').nth(1).fill(address);
  await ownForm.getByRole('button',{name:'Add',exact:true}).click();
  await setup.getByRole('button',{name:'Back',exact:true}).click();
  await page.locator('#portfolio-wallets-overlay').getByRole('button',{name:'Back',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('$2,050.00'));
  assert.equal(await page.getByRole('button',{name:'Open Ethereum Wallets',exact:true}).count(),0);
  assert.match(await assets.innerText(),/2,050\.00/);assert.match(await cex.innerText(),/1,000\.00/);
  await assets.click();await page.getByRole('button',{name:'Open FTs',exact:true}).click();
  const overlay=page.locator('#portfolio-holdings-overlay');
  await overlay.getByRole('button',{name:'Ethereum · ETH',exact:true}).waitFor();
  assert.match(await overlay.innerText(),/Ethereum · ETH/);
  await overlay.getByRole('checkbox',{name:'Exclude Ethereum from Assets Across Wallets',exact:true}).check();
  assert.match(await assets.innerText(),/\$50\.00/);assert.match(await cex.innerText(),/− \$1,000\.00/,'exclusion removes ETH current value from the combined result');
  await overlay.getByRole('checkbox',{name:'Exclude Ethereum from Assets Across Wallets',exact:true}).uncheck();
  await overlay.getByRole('button',{name:'Back',exact:true}).click();await overlay.getByRole('button',{name:'Back',exact:true}).click();
  await cex.click();
  const gain=page.locator('#portfolio-gain-loss-overlay');
  await gain.locator('.portfolio-gain-comparison').waitFor();
  assert.match(await gain.locator('.portfolio-gain-comparison').innerText(),/1,050\.00/,'CEX IN sums historical ADA and ETH fiat values');
  assert.match(await gain.locator('.portfolio-eth-comparison').innerText(),/ETH IN[\s\S]*ETH OUT[\s\S]*1 ETH[\s\S]*1,000\.00[\s\S]*0 ETH/,'native ETH IN/OUT are shown separately from combined equivalents');
  assert.equal(await gain.locator('a[href="https://etherscan.io/tx/'+hash+'"]').count(),1);
  await gain.getByRole('button',{name:'CEX OUT',exact:true}).click();assert.equal(await gain.locator('a[href*="etherscan.io/tx/"]').count(),0);
  await gain.getByRole('button',{name:'CEX IN',exact:true}).click();assert.equal(await gain.locator('a[href*="etherscan.io/tx/"]').count(),1);
  await gain.getByRole('button',{name:'ETH IN',exact:true}).click();
  assert.equal(await gain.locator('a[href*="etherscan.io/tx/"]').count(),1);
  assert.equal(await gain.locator('a[href*="cardanoscan.io/transaction/"]').count(),0);
  await gain.getByRole('button',{name:'ETH OUT',exact:true}).click();
  assert.equal(await gain.locator('a[href*="etherscan.io/tx/"]').count(),0);
  await gain.getByRole('button',{name:'All',exact:true}).click();
  for(const width of [1200,390,320]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'CEX and ETH summaries fit the viewport');
  }
  await page.setViewportSize({width:1200,height:900});
  await gain.getByRole('button',{name:'Back',exact:true}).click();
  await walletsTile.click();await page.getByRole('button',{name:'Open My Wallets',exact:true}).click();
  const own=page.locator('#portfolio-wallet-menu-wallets');
  await own.getByRole('button',{name:'Refresh Ethereum wallets',exact:true}).waitFor();
  assert.match(await own.innerText(),/ETH Savings/);
  assert.ok(!(await own.innerText()).includes('Ethereum CEX addresses'));
  await own.getByRole('button',{name:'Refresh Ethereum wallets',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('main [role="status"]')?.textContent?.includes('Checking Ethereum'));
  await page.waitForTimeout(100);
  assert.ok(requests.filter(r=>r.action==='history').slice(-2).every(r=>r.startBlock===136),'cached Ethereum history only checks the reorg window and new blocks');
  await own.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Open DEX / CEX & Swap',exact:true}).click();
  const eth=page.locator('#portfolio-wallet-menu-exchanges');
  await eth.locator('form').last().waitFor();
  assert.match(await eth.innerText(),/Bitvavo/);
  const cexForm=eth.locator('form').last();await cexForm.locator('input').nth(0).fill('Not a CEX');await cexForm.locator('input').nth(1).fill(address);await cexForm.getByRole('button',{name:'Add',exact:true}).click();
  assert.match(await eth.innerText(),/Your own wallet cannot/);
  for(const width of [1200,390,320]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Ethereum tables fit the viewport');
    if(width===390)await page.screenshot({path:'/tmp/tdsp-ethereum-mobile.png',fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: Ethereum wallets, native holdings/exclusion, combined CEX totals and filters, incremental refresh, own-wallet rejection and mobile layout.');
}finally{await browser.close();}
