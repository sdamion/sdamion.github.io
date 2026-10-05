import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src');
const require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const id='01fbdb51e87edfc6383137405de64d8486114936073c909acc246fa0000de140696d615f6d6f686275646d39';
const other='a'.repeat(56)+'01';
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import Home from './App';window.mount=()=>{window.root=createRoot(document.getElementById('app'));window.root.render(<Home memberStake="stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel"/>);};window.mount();`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'cached-portfolio-fixture',setup(build){
  build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
  build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8'))
    .replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)')
    .replace('setSnapshot(null);setError','setError')
    .replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){return;')
    .replace("import {portfolioSettings as localStorage,flushVault,storageMode} from './vault';","import {flushVault,storageMode} from './vault'; const localStorage=window.fixtureStorage;")}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 await page.goto('http://127.0.0.1:8998/');
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.evaluate(({id,other})=>{
   const settings=new Map([['tdsp-member-basis:stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',JSON.stringify({[id]:{average:'0'},[other]:{average:'0'}})]]);
   window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()]};
   window.fixture={groups:{},infos:[{address:'wallet',balance:'0',utxo_set:[{tx_hash:'fixture',tx_index:0,value:'0',asset_list:[id,other].map(id=>({policy_id:id.slice(0,56),asset_name:id.slice(56),quantity:'1',decimals:0}))}]}],facts:{},txs:[],markets:{[id]:{token_id:id,name:'Intersect badge',decimals:0,price_by_usd:6127.25},[other]:{token_id:other,name:'Other asset',decimals:0,price_by_usd:4564.64}},adaUsd:0.25,history:{},complete:true};
   window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 },{id,other});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const metric=page.locator('.governance-menu-card').filter({has:page.locator('.governance-card-detail',{hasText:'Assets Gains/Loss'})});
 await page.getByRole('button',{name:'Open Assets Across Wallets',exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('$10,691.89'));
 assert.match(await metric.innerText(),/10,691\.89/);
 await page.getByRole('button',{name:'Open Assets Across Wallets',exact:true}).click();
 const toggle=page.getByRole('switch',{name:'Include Intersect badge in gain/loss',exact:true});
 await toggle.uncheck();
 await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('$4,564.64'));
 assert.match(await metric.innerText(),/4,564\.64/);
 assert.equal(await toggle.isChecked(),false);
 assert.match(await toggle.locator('xpath=ancestor::td').innerText(),/Excluded from total/);
 assert.match(await metric.innerText(),/Excluded net gain\/loss: \$6,127\.25/);
 assert.match(await page.getByRole('button',{name:'Open Assets Across Wallets',exact:true}).innerText(),/10,691\.89/,'asset valuation unchanged');
 await toggle.check();assert.match(await metric.innerText(),/10,691\.89/);
 await toggle.uncheck();
 await page.evaluate(()=>{window.root.unmount();window.mount();});
 await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('$4,564.64'));
 assert.match(await metric.innerText(),/4,564\.64/,'disabled asset remains excluded after reload');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addScriptTag({content:await readFile('vendor/chart.js','utf8')});
 await page.evaluate(()=>{
   window.TDSPCharts={load:async()=>window.Chart};
   const exchange='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
   window.fixtureStorage.setItem('tdsp-member-cex-v1:stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',JSON.stringify([{address:exchange,name:'Exchange'}]));
   const base={feeRaw:'0',internal:false,wallets:['wallet'],assets:{},decimals:{},swapCandidate:false};
   window.fixture.facts={
     incoming:{...base,hash:'incoming',time:1700000000,adaRaw:'100000000',externalInputs:[{address:exchange,lovelace:'100000000'}],externalOutputs:[]},
     outgoing:{...base,hash:'outgoing',time:1710000000,adaRaw:'-40000000',externalInputs:[],externalOutputs:[{address:exchange,lovelace:'40000000'}]}
   };
   window.fixture.txs=Object.values(window.fixture.facts).map(f=>({tx_hash:f.hash,block_time:f.time,block_height:1}));
   window.fixture.history={'2023-11-14':0.25,'2024-03-09':0.30};
   window.root.unmount();window.mount();
 });
 await page.getByRole('button',{name:'Open ADA Gains/Loss',exact:true}).click();
 const gain=page.locator('#portfolio-gain-loss-overlay');
 const chart=gain.locator('canvas');
 await page.waitForFunction(()=>{const canvas=document.querySelector('#portfolio-gain-loss-overlay canvas');return canvas&&window.Chart.getChart(canvas)?.data.datasets.length===2;});
 const values=await chart.evaluate(canvas=>window.Chart.getChart(canvas).data.datasets.map(d=>({name:d.label,values:d.data.map(p=>p.y)})));
 assert.deepEqual(values,[{name:'ADA IN',values:[100,100]},{name:'ADA OUT',values:[0,40]}]);
 await page.setViewportSize({width:1440,height:1000});
 const overview=gain.locator('.portfolio-gain-overview');
 const summary=gain.getByRole('region',{name:'ADA Gains/Loss breakdown'});
 const filters=gain.getByRole('region',{name:'Transaction search options'});
 const graph=gain.getByRole('region',{name:'ADA IN and ADA OUT timeline graph'});
 for(const total of await summary.locator('.portfolio-gain-total').all()){
   const neutral=await total.locator(':scope > span').evaluate(el=>getComputedStyle(el).color);
   assert.equal(await total.locator('.pool-delegator-usd').evaluate(el=>getComputedStyle(el).color),neutral,'summary USD and labels stay neutral');
   assert.notEqual(await total.locator('.pool-delegator-amount > span').evaluate(el=>getComputedStyle(el).color),neutral,'summary ADA carries direction color');
 }
 assert.ok((await summary.boundingBox()).x>(await graph.boundingBox()).x,'summary is beside graph');
 assert.ok((await filters.boundingBox()).y>=(await overview.boundingBox()).y+(await overview.boundingBox()).height,'filters below complete overview');
 assert.ok((await gain.locator('table').boundingBox()).y>(await filters.boundingBox()).y,'table follows filters');
 await page.screenshot({path:'/tmp/portfolio-gain-chart-desktop.png',fullPage:true});
 for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   await page.waitForFunction(()=>{const el=document.querySelector('.portfolio-gain-overview');return el&&el.scrollWidth<=el.clientWidth+1;});
   assert.ok((await summary.boundingBox()).y>(await graph.boundingBox()).y,'summary stacks below graph');
   assert.ok(await overview.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'chart and summary fit mobile');
 }
 await page.screenshot({path:'/tmp/portfolio-gain-chart-mobile.png',fullPage:true});
 await gain.locator('input[name="gain-loss-from"]').fill('2024-01-01');
 await page.waitForFunction(()=>window.Chart.getChart(document.querySelector('#portfolio-gain-loss-overlay canvas'))?.data.datasets[0].data.length===1);
 assert.equal(await gain.locator('tbody tr').count(),1,'dates filter graph and table');
 await page.evaluate(()=>document.documentElement.dataset.theme='dark');
 await page.waitForFunction(()=>window.Chart.getChart(document.querySelector('#portfolio-gain-loss-overlay canvas'))?.data.datasets[1].borderColor==='#5eead4');
 assert.deepEqual(errors,[]);
 console.log('PASS: asset exclusion persistence; real chart totals, theme, responsive summary layout and date-filtered graph/table.');
}finally{await browser.close();}
