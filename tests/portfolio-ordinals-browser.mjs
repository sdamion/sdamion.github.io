import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',address='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',other='1BitcoinEaterAddressDontSendf59kuE',tip='f'.repeat(64);
const sold='a'.repeat(64)+'i0',held='d'.repeat(64)+'i1',html='af4caa26e26ddb6f7ffc150b9cda93c85c327d5bcff28ff976caf7f167d6d220i129',dependency='05e58772431158b0fa0de470253f80c1619e7411f495a122c574042a3eee2e07i0';
const receipt={hash:'b'.repeat(64),height:1,time:1700000000,feeRaw:'100',inputs:[{address:other,raw:'1000'}],outputs:[{address,raw:'900'}]};
const send={hash:'c'.repeat(64),height:2,time:1700000100,feeRaw:'100',inputs:[{address,raw:'900'}],outputs:[{address:other,raw:'800'}]};
const ownedTx={...receipt,hash:'e'.repeat(64),height:3,time:1700000200};
const info=(id,name,contentType)=>({id,name,contentType,number:id===held?456:123,owner:id===held?address:other,ownerOutput:(id===held?ownedTx.hash:send.hash)+':0',created:1600000000,genesisAddress:other,collection:'test-art'});
const metadata={[sold]:info(sold,'Sold Ordinal','image/png'),[held]:info(held,'Vector Ordinal','image/svg+xml'),[html]:info(html,'<img src=x onerror="window.attacked=true">','text/html')};
const events=[{id:sold,hash:receipt.hash,side:'receive',confirmed:true,time:receipt.time},{id:sold,hash:send.hash,side:'send',confirmed:true,time:send.time},{id:held,hash:ownedTx.hash,side:'receive',confirmed:true,time:ownedTx.time},{id:html,hash:receipt.hash,side:'receive',confirmed:true,time:receipt.time}];
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII=';
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`import {createRoot} from 'react-dom/client';import Home from './App';let version=0;const root=createRoot(document.getElementById('app'));window.reopen=(role='admin')=>root.render(<Home key={++version} memberStake="${stake}" role={role}/>);window.reopen();`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){
 build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
 build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
 build.onLoad({filter:/\/use-bitcoin\.ts$/},()=>({loader:'ts',contents:`import {emptyDownloadProgress} from './download-progress';const wallets=[{address:'${address}',name:'BTC Art Wallet'}],empty={accounts:{},history:{},usd:null},exchanges=[];export function useBitcoin(stake,enabled){return {wallets:enabled?wallets:exchanges,exchanges,data:enabled?window.btcFixture:empty,busy:false,error:'',downloadProgress:emptyDownloadProgress(),refresh:async()=>{},saveWallets:()=>true,saveExchanges:()=>true};}`}));
 build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){setInitialising(false);setStatus("Ready");return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[],requests=[],images=[];
 let unavailable=false;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()),operation=url.pathname.split('/').pop();
  if(url.hostname==='ordiscan.com'&&url.pathname.startsWith('/content/')){
   images.push(url.pathname);
   if(url.pathname==='/content/'+html)return route.fulfill({contentType:'text/html',body:`<!doctype html><script src="/content/${dependency}"></script>`});
   if(url.pathname==='/content/'+dependency)return route.fulfill({contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:`
     const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;document.documentElement.append(canvas);const context=canvas.getContext('2d');context.fillStyle='#00bbaa';context.fillRect(0,0,100,100);
     try{parent.attacked=true;}catch{window.parentBlocked=true;}
     try{localStorage.setItem('attacked','true');}catch{window.storageBlocked=true;}
     try{parent.document.body.dataset.attacked='true';}catch{window.documentBlocked=true;}
   `});
   return route.fulfill({contentType:'image/png',body:Buffer.from(png,'base64')});
  }
  if(operation==='bitcoin-ordinals'){
   const body=route.request().postDataJSON();requests.push(body);assert.equal(body.address===undefined||body.address===address,true,'only owned addresses are indexed');
   if(unavailable)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Configure ORDISCAN_API_KEY in the backend to load Bitcoin Ordinals.'})});
   const result=body.action==='metadata'?{metadata:metadata[body.id]}:{address,rows:body.action==='owned'?[metadata[held]]:events,more:false};
   return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  }
  if(operation==='price')return route.fulfill({contentType:'application/json',body:'{"cardano":{"usd":1}}'});
  return route.fulfill({contentType:'text/html',body:'<div id="portfolio-refresh-action"></div><div id="app"></div>'});
 });
 await page.goto('http://127.0.0.1:8997/');await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.evaluate(({address,tip,receipt,send,ownedTx,png})=>{
  const settings=new Map();window.fixtureStorage={getItem:key=>settings.get(key)??null,setItem:(key,value)=>settings.set(key,value),keys:()=>[...settings.keys()],setItems:(values,remove=[])=>{for(const key of remove)settings.delete(key);for(const [key,value]of Object.entries(values))settings.set(key,value);}};
  window.btcFixture={accounts:{[address]:{tip,raw:'900',transactions:[receipt,send,ownedTx]}},history:{'2023-11-14':100000},usd:100000};
  const asset='1'.repeat(56)+'41';window.fixture={groups:{},infos:[],facts:{cardano:{hash:'cardano',time:1700000000,adaRaw:'0',feeRaw:'0',internal:false,assets:{[asset]:'1'},decimals:{[asset]:0},wallets:[],swapCandidate:false,externalInputs:[],externalOutputs:[]}},txs:[{tx_hash:'cardano',block_time:1700000000}],markets:{[asset]:{name:'Cardano Artwork',is_nft:true,registry_logo:'data:image/png;base64,'+png}},adaUsd:1,history:{'2023-11-14':1},complete:true};
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 },{address,tip,receipt,send,ownedTx,png});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const assets=page.getByRole('button',{name:'Open Assets',exact:true});await assets.waitFor();assert.equal(requests.length,0,'Ordinals API is not called while the gallery is closed');
 async function openGallery(){await assets.click();await page.getByRole('button',{name:'Open Historical NFTs',exact:true}).click();}
 await openGallery();const gallery=page.locator('#portfolio-holdings-overlay');
 await gallery.locator('[data-inscription="'+sold+'"] img').waitFor();await gallery.locator('[data-inscription="'+html+'"] .portfolio-nft-caption').filter({hasText:'onerror'}).waitFor();
 assert.equal(await gallery.locator('.portfolio-nft-tile').count(),4,'Cardano NFTs and received/sent Ordinals share the gallery');
 const soldTile=gallery.locator('[data-inscription="'+sold+'"]'),heldTile=gallery.locator('[data-inscription="'+held+'"]');
 assert.match(await soldTile.innerText(),/2023-11-14/);assert.equal(await soldTile.locator('.portfolio-nft-owned').count(),0);
 assert.match(await heldTile.locator('.portfolio-nft-owned').innerText(),/Owned[\s\S]*BTC Art Wallet/);
 const recursiveTile=gallery.locator('[data-inscription="'+html+'"]');
 await recursiveTile.scrollIntoViewIfNeeded();
 const artwork=recursiveTile.frameLocator('iframe');await artwork.locator('canvas').waitFor();
 assert.equal(await artwork.locator('canvas').evaluate(el=>el.getContext('2d').getImageData(50,50,1,1).data[3]),255,'recursive dependency paints nonblank artwork');
 assert.equal(await recursiveTile.locator('iframe').getAttribute('sandbox'),'allow-scripts');
 assert.equal(await artwork.locator('html').evaluate(()=>window.parentBlocked&&window.storageBlocked&&window.documentBlocked),true,'artwork cannot read parent data or origin storage');
 assert.equal(await page.evaluate(()=>!!window.attacked),false);
 assert.equal(images.includes('/content/'+held),false,'SVG remains unsupported');
 await recursiveTile.getByRole('button').click();const recursiveOverlay=page.locator('#portfolio-ordinal-preview-overlay');
 await recursiveOverlay.frameLocator('iframe').locator('canvas').waitFor();
 assert.equal(await recursiveOverlay.locator('iframe').getAttribute('referrerpolicy'),'no-referrer');
 await recursiveOverlay.getByRole('button',{name:'Back',exact:true}).click();
 await heldTile.getByRole('button').click();const preview=page.locator('#portfolio-ordinal-preview-overlay');
 await preview.getByText('Preview unavailable for this inscription type.',{exact:true}).waitFor();assert.equal(await preview.locator('img,iframe,object,embed').count(),0);
 assert.equal(await preview.getByRole('link',{name:'Open inscription in Ordiscan'}).getAttribute('rel'),'noopener noreferrer');await preview.getByRole('button',{name:'Back',exact:true}).click();
 assert.equal(await page.evaluate(({address})=>window.btcFixture.accounts[address].raw,{address}),'900');
 assert.doesNotMatch(await soldTile.innerText(),/Buy:|Sell:/,'BTC inscriptions never display fabricated ADA prices');
 const search=gallery.getByRole('textbox',{name:'Search historical NFTs',exact:true});await search.fill('BTC Art Wallet');assert.equal(await gallery.locator('.portfolio-nft-tile').count(),3);await search.fill('');
 const count=requests.length;await page.evaluate(()=>window.reopen());await openGallery();await gallery.locator('[data-inscription="'+sold+'"] img').waitFor();assert.equal(requests.length,count,'fresh member cache avoids repeating provider calls');
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await gallery.screenshot({path:'/tmp/portfolio-ordinals-'+width+'.png'});}
 unavailable=true;await gallery.getByRole('button',{name:'Refresh Bitcoin Ordinals',exact:true}).click();await gallery.getByRole('alert').filter({hasText:'ORDISCAN_API_KEY'}).waitFor();assert.ok(await gallery.locator('[data-inscription]').count()>0,'provider failures retain saved Ordinal history');
 const finalCount=requests.length;await page.evaluate(()=>window.reopen('delegator'));await assets.waitFor();await openGallery();assert.equal(await gallery.getByRole('button',{name:'Refresh Bitcoin Ordinals',exact:true}).count(),0);assert.equal(requests.length,finalCount,'delegators cannot query admin-only Ordinals data');
 assert.deepEqual(errors,[]);
 console.log('PASS: on-demand Ordinals history, merged gallery, raster and sandboxed recursive previews, blocked parent/storage access, cached metadata, failure retention, search, access isolation and mobile layouts.');
}finally{await browser.close();}
