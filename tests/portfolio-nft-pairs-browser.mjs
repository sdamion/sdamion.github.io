import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',a='a'.repeat(56)+'01',b='b'.repeat(56)+'01';
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`import {createRoot} from 'react-dom/client';import Home from './App';createRoot(document.getElementById('root')).render(<Home memberStake="${stake}"/>);`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){
 build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
 build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
 build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){setStatus("Ready");return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('.toml'))return route.fulfill({contentType:'text/plain',body:await readFile('.'+url.pathname,'utf8')});
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
  return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="portfolio-refresh-action"></div><div id="root"></div>'});
 });
 await page.goto('http://127.0.0.1:8999/');await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.evaluate(({stake,a,b})=>{
  const settings=new Map();window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()],setItems:()=>{}};
  const fact=(hash,time,id,raw,ada,extra={})=>({hash,time,assets:{[id]:raw},adaRaw:String(ada*1e6),feeRaw:'0',internal:false,swapCandidate:true,wallets:[stake],decimals:{[id]:0},externalInputs:[],externalOutputs:[],...extra});
  const facts=[fact('1'.repeat(64),1700000000,a,'1',-10),fact('2'.repeat(64),1700000100,a,'-1',20),fact('3'.repeat(64),1700000200,b,'1',-3,{minted:{[b]:'1'},externalOutputs:[{address:'vendor',lovelace:'3000000'}]}),fact('4'.repeat(64),1700000300,b,'-1',8)];
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII=';
  window.fixture={groups:{[stake]:['addr1fixture']},infos:[],facts:Object.fromEntries(facts.map(fact=>[fact.hash,fact])),txs:facts.map(fact=>({tx_hash:fact.hash,block_time:fact.time,block_height:1})),markets:{[a]:{name:'Purchased NFT',is_nft:true,image},[b]:{name:'Minted NFT',is_nft:true,image}},adaUsd:1,history:{'2023-11-14':1},complete:true};window.original=JSON.stringify(window.fixture);
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 },{stake,a,b});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 await page.getByRole('button',{name:'Open Transactions',exact:true}).click();const transactions=page.locator('#portfolio-transactions-overlay');
 await transactions.locator('[data-nft-pair]').first().waitFor();assert.equal(await transactions.locator('[data-nft-pair]').count(),2);
 for(const [id,cost,proceeds]of [[a,'Buy: 10 ADA','Sell: 20 ADA'],[b,'Mint: 3 ADA','Sell: 8 ADA']]){
  const pair=transactions.locator('[data-nft-pair="'+id+'"]').locator('..');
  assert.equal(await pair.locator('img').count(),1,'one image per paired NFT');
  await pair.getByText(cost,{exact:true}).waitFor();await pair.getByText(proceeds,{exact:true}).waitFor();
  assert.equal(await pair.locator('.portfolio-swap-leg').count(),2);assert.equal(await pair.locator('a[href^="https://cardanoscan.io/transaction/"]').count(),2);
 }
 await transactions.getByRole('button',{name:'View Minted NFT details',exact:true}).click();
 let preview=page.locator('#portfolio-image-preview-overlay');await preview.locator('img').waitFor();assert.equal(await preview.locator('img').count(),1);
 await preview.getByText('Mint: 3 ADA',{exact:true}).waitFor();await preview.getByText('Sell: 8 ADA',{exact:true}).waitFor();await preview.getByRole('button',{name:'Back',exact:true}).click();
 const search=transactions.locator('input[name="transactions-search"]');await search.fill('1'.repeat(64));assert.equal(await transactions.locator('[data-nft-pair]').count(),0,'a hash filter does not reintroduce its hidden counterpart');await search.fill('');
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await transactions.screenshot({path:'/tmp/portfolio-nft-pairs-'+width+'.png'});}
 await transactions.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Open Assets',exact:true}).click();await page.getByRole('button',{name:'Open Historical NFTs',exact:true}).click();const gallery=page.locator('#portfolio-holdings-overlay');
 await gallery.locator('.portfolio-nft-tile').first().waitFor();assert.equal(await gallery.locator('.portfolio-nft-tile').count(),2);
 for(const text of ['Buy: 10 ADA','Sell: 20 ADA','Mint: 3 ADA','Sell: 8 ADA'])await gallery.getByText(text,{exact:true}).waitFor();
 await gallery.getByRole('button',{name:'View Purchased NFT details',exact:true}).click();preview=page.locator('#portfolio-image-preview-overlay');
 await preview.locator('img').waitFor();assert.equal(await preview.locator('img').count(),1);await preview.getByText('Buy: 10 ADA',{exact:true}).waitFor();await preview.getByText('Sell: 20 ADA',{exact:true}).waitFor();await preview.getByRole('button',{name:'Back',exact:true}).click();
 for(const file of ['shared/portfolio-i18n-keys.js','shared/portfolio-i18n.js','shared/i18n.js'])await page.addScriptTag({content:await readFile(file,'utf8')});
 for(const language of ['nl','ja','es','en']){
  await page.evaluate(language=>window.TDSPI18n.setLanguage(language),language);
  const label=await page.evaluate(()=>window.TDSPI18n.translateText('Mint: {price} ADA').replace('{price}','3'));await gallery.getByText(label,{exact:true}).waitFor();
  assert.equal(await gallery.getByText('Minted NFT',{exact:true}).count(),1);assert.equal(await page.evaluate(()=>JSON.stringify(window.fixture)===window.original),true);
 }
 assert.deepEqual(errors,[]);console.log('PASS: paired NFT transactions and historical gallery share one image with buy/mint and sell prices; links, legs, filters, mobile layout, translations and source data are preserved.');
}finally{await browser.close();}
