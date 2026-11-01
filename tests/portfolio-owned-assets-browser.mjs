import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',eth='0x'+'1'.repeat(40),eth2='0x'+'2'.repeat(40),swap='0x'+'9'.repeat(40),sol='11111111111111111111111111111111',btc='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',ordinal='a'.repeat(64)+'i0';
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`import {createRoot} from 'react-dom/client';import Home from './App';const root=createRoot(document.getElementById('app'));let version=0;window.reopen=(role='admin')=>root.render(<Home key={++version} memberStake="${stake}" role={role}/>);window.reopen();`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){
 build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
 build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
 for(const [chain,enabled,wallets]of [['ethereum','ready',`[{address:'${eth}',name:'ETH One'},{address:'${eth2}',name:'ETH Two'}]`],['solana','enabled',`[{address:'${sol}',name:'SOL Wallet'}]`],['bitcoin','enabled',`[{address:'${btc}',name:'BTC Wallet'}]`]]){
  build.onLoad({filter:new RegExp('/use-'+chain+'\\.ts$')},()=>({loader:'ts',contents:`import {emptyDownloadProgress} from './download-progress';const wallets=${wallets};const allWallets=[...wallets${chain==='ethereum'?`,{address:'${swap}',name:'Swap',group:'swap'}`:''}];const empty={accounts:{},history:{},usd:null,updated:null};export function use${chain[0].toUpperCase()+chain.slice(1)}(stake,${enabled}){return {wallets:${enabled}?wallets:[],allWallets,swapWallets:[],exchanges:[],data:${enabled}?window.chainData.${chain}:empty,loaded:true,busy:false,error:'',status:'',downloadProgress:emptyDownloadProgress(),refresh:async()=>{},saveWallets:()=>true,saveExchanges:()=>true};}`}));
 }
 build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){setInitialising(false);setStatus("Ready");return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),requests=[],errors=[];let unavailable=false;
 page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
 const token=(chain,id,standard,name,raw,decimals)=>({chain,id,standard,name,raw,decimals,symbol:'',image:null,explorer:null});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()),operation=url.pathname.split('/').pop();
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
  if(url.pathname.endsWith('.toml'))return route.fulfill({contentType:'text/plain',body:await readFile('.'+url.pathname,'utf8')});
  if(['ethereum','solana','bitcoin-ordinals'].includes(operation)){
   const body=route.request().postDataJSON();requests.push({operation,...body});assert.notEqual(body.address,swap,'Swap and CEX addresses are never scanned for holdings');
   if(unavailable)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Owned assets unavailable. Saved data is retained.'})});
   let result;
   if(operation==='ethereum')result={address:body.address,assets:body.kind==='tokens'?[token('ethereum','ethereum:1:0x'+'3'.repeat(40),'ERC-20','Shared ETH Token',body.address===eth?'1230000':'1000000',6)]:[token('ethereum','ethereum:1:0x'+'4'.repeat(40)+':'+(body.address===eth?'1':'2'),'ERC-721','ETH Art '+(body.address===eth?'One':'Two'),'1',0)],cursor:null};
   else if(operation==='solana')result={address:sol,assets:[token('solana','solana:mainnet:ft','SPL','SOL FT','5000',3),token('solana','solana:mainnet:nft','Compressed NFT','SOL Artwork','1',0)],more:false};
   else if(body.action==='owned')result={address:btc,rows:[{id:ordinal,number:123,contentType:'image/png',owner:btc,ownerOutput:'b'.repeat(64)+':0',created:1600000000,genesisAddress:btc,name:'Owned Ordinal',collection:null}],more:false};
   else result={address:btc,assets:[token('bitcoin','bitcoin:'+body.action+':TOKEN',body.action==='runes'?'Rune':'BRC-20',body.action==='runes'?'BTC Rune':'BTC BRC20','100',body.action==='runes'?null:0)],more:false};
   return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  }
  if(operation==='price')return route.fulfill({contentType:'application/json',body:'{"cardano":{"usd":1}}'});
  if(url.hostname!=='127.0.0.1')return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:'text/html',body:'<div id="portfolio-refresh-action"></div><div id="app"></div>'});
 });
 await page.goto('http://127.0.0.1:8997/');await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.evaluate(({eth,eth2,sol,btc,stake})=>{
  const settings=new Map();window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()],setItems:(values,remove=[])=>{for(const key of remove)settings.delete(key);for(const [key,value]of Object.entries(values))settings.set(key,value);}};
  window.chainData={ethereum:{accounts:Object.fromEntries([eth,eth2].map(address=>[address,{balanceWei:'1000000000000000000',block:1,transactions:[]}])),history:{},usd:1000,updated:null},solana:{accounts:{[sol]:{raw:'1000000000',slot:1,checkpoint:null,transactions:[]}},history:{},usd:100},bitcoin:{accounts:{[btc]:{raw:'100000000',tip:'f'.repeat(64),transactions:[]}},history:{},usd:100000}};
  const policy='1'.repeat(56),ft=policy+'41',nft=policy+'42';window.fixture={groups:{[stake]:['addr1fixture']},infos:[{address:'addr1fixture',balance:'1000000',utxo_set:[{tx_hash:'c'.repeat(64),tx_index:0,value:'1000000',asset_list:[{policy_id:policy,asset_name:'41',quantity:'2500',decimals:3},{policy_id:policy,asset_name:'42',quantity:'1',decimals:0}]}]}],facts:{},txs:[],markets:{[ft]:{name:'Cardano FT',decimals:3},[nft]:{name:'Cardano NFT',decimals:0,is_nft:true}},adaUsd:1,history:{},complete:true};
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 },{eth,eth2,sol,btc,stake});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const assets=page.getByRole('button',{name:'Open Assets',exact:true});await assets.waitFor();assert.equal(requests.length,0);
 async function open(){await assets.click();await page.getByRole('button',{name:'Open NFTs',exact:true}).click();}
 await open();const gallery=page.locator('#portfolio-holdings-overlay');
 await gallery.getByText('BTC BRC20',{exact:true}).waitFor();await gallery.getByText('Owned Ordinal',{exact:true}).waitFor();await gallery.getByText('SOL Artwork',{exact:true}).waitFor();
 await gallery.getByRole('button',{name:'Refresh owned assets',exact:true}).waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('button[aria-label="Refresh owned assets"]').disabled);
 for(const name of ['Cardano FT','Cardano NFT','Shared ETH Token','ETH Art One','ETH Art Two','SOL FT','SOL Artwork','BTC Rune','BTC BRC20'])assert.equal(await gallery.getByText(name,{exact:true}).count(),1,name+' is present once');
 const ft=gallery.locator('[data-owned-asset="ethereum:1:0x'+'3'.repeat(40)+'"]');assert.match(await ft.innerText(),/2\.23/);assert.match(await ft.innerText(),/ETH One.*ETH Two/);
 assert.ok(!requests.some(row=>row.action==='activity'),'owned Ordinals do not require a historical transaction scan');
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await gallery.screenshot({path:'/tmp/portfolio-owned-assets-'+width+'.png'});}
 await gallery.getByLabel('Network',{exact:true}).selectOption('solana');assert.equal(await gallery.locator('.portfolio-nft-tile').count(),3);
 await gallery.getByLabel('Asset type',{exact:true}).selectOption('nft');assert.equal(await gallery.locator('.portfolio-nft-tile').count(),1);await gallery.getByLabel('Asset type',{exact:true}).selectOption('');await gallery.getByLabel('Network',{exact:true}).selectOption('');
 await gallery.getByLabel('Search owned assets',{exact:true}).fill('Shared ETH Token');assert.equal(await gallery.locator('.portfolio-nft-tile').count(),1);await gallery.getByLabel('Search owned assets',{exact:true}).fill('');
 const count=requests.length;await page.evaluate(()=>window.reopen());await open();await gallery.getByText('BTC BRC20',{exact:true}).waitFor();assert.equal(requests.length,count,'fresh member inventory cache avoids repeating provider calls');
 for(const file of ['shared/portfolio-i18n-keys.js','shared/portfolio-i18n.js','shared/i18n.js'])await page.addScriptTag({content:await readFile(file,'utf8')});
 for(const language of ['nl','ja','es','en']){
  await page.evaluate(language=>window.TDSPI18n.setLanguage(language),language);
  const label=await page.evaluate(()=>window.TDSPI18n.translateText('Search owned assets'));await gallery.getByLabel(label,{exact:true}).waitFor();assert.match(await ft.innerText(),/2\.23/);assert.equal(await gallery.getByText('Shared ETH Token',{exact:true}).count(),1);
 }
 unavailable=true;await gallery.getByRole('button',{name:'Refresh owned assets',exact:true}).click();await gallery.getByRole('alert').first().waitFor();assert.equal(await gallery.getByText('BTC BRC20',{exact:true}).count(),1,'provider failure retains complete saved holdings');
 const final=requests.length;await page.waitForFunction(()=>!document.querySelector('button[aria-label="Refresh owned assets"]').disabled);await page.evaluate(()=>window.reopen('delegator'));await open();assert.equal(await gallery.getByText('Shared ETH Token',{exact:true}).count(),0);assert.equal(requests.length,final,'revoked chain rights hide cached holdings and prevent requests');
 assert.deepEqual(errors,[]);console.log('PASS: combined current holdings across four chains, native/FT/NFT/Ordinal coverage, exact aggregation, no history prerequisite, filters, member cache, failures, languages, access isolation and desktop/mobile layout.');
}finally{await browser.close();}
