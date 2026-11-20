// Usage: node tests/portfolio-robinhood-artwork-browser.mjs /path/to/playwright/index.mjs [../koios-proxy]
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const backend=path.resolve(process.argv[3]||'../koios-proxy');
const requireBackend=createRequire(path.join(backend,'package.json')),sharp=requireBackend('sharp');
const {createPortfolioImageCache}=await import(path.join(backend,'member-portfolio/image-cache.mjs'));
const {createRobinhoodNftImageResolver}=await import(path.join(backend,'member-portfolio/robinhood-nft-image.mjs'));
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const directory=await mkdtemp(path.join(os.tmpdir(),'mallard-gallery-'));
const address='0x'+'1'.repeat(40),contract='0x0d58589536f442da1c192c89232448c23d8b41bb';
const id=`robinhood:4663:${contract}:5441`,stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const metadata='https://ardrive.net/RsW8OP6hSXilFVdGWV5BXB1o-KLRuqrA3NbMw0-sAHU/5441';
const artwork='https://ardrive.net/K1-rD3FUZ3Au9ZHY3Ei4_hXtqLbqNGi0NQmuWMowHAc/5437.png';
const png=await sharp({create:{width:3,height:3,channels:3,background:'#ffbd00'}}).png().toBuffer();
const calls=[],requests=[],errors=[];
const fetcher=async(url,options)=>{
  calls.push(String(url));assert.equal(options.redirect,'error');
  if(options.method==='POST'){
    const request=JSON.parse(options.body);assert.equal(request.params[0].to,contract);
    assert.ok(request.params[0].data.endsWith('1541'));
    const hex=Buffer.from(metadata).toString('hex');
    return Response.json({jsonrpc:'2.0',id:1,result:'0x'+(32).toString(16).padStart(64,'0')+(hex.length/2).toString(16).padStart(64,'0')+hex.padEnd(Math.ceil(hex.length/64)*64,'0')});
  }
  if(new URL(url).pathname.endsWith('/5441'))return Response.json({image:artwork});
  assert.ok(new URL(url).pathname.endsWith('/5437.png'),'the contract mapping chooses the image');
  return new Response(png);
};
const cache=createPortfolioImageCache({directory,fetcher,resolveNftImage:createRobinhoodNftImageResolver({fetcher}),log:()=>{}});
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';import Home from './App';import {encodeOwnedAssets} from './owned-assets';
const asset={id:'${id}',chain:'robinhood',standard:'ERC-721',name:'MallardOrder',symbol:'MallardOrder',raw:'1',decimals:0,image:null,explorer:null};
const inventory={'robinhood:${address}':{chain:'robinhood',address:'${address}',checkedAt:Date.now(),assets:[asset]}};
window.fixtureStorage.setItems(encodeOwnedAssets('tdsp-member-owned-assets:${stake}',inventory));
window.assetBefore=JSON.stringify(asset);window.inventory=inventory;
createRoot(document.getElementById('app')).render(<Home memberStake="${stake}" portfolioAccess={{cardano:false,ethereum:false,robinhood:true,solana:false,bitcoin:false}}/>);
`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':source+'/core.ts','@/lib/portfolio-cache':source+'/cache.ts','@/components/ui/input':source+'/ui.tsx','@/components/ui/table':source+'/ui.tsx','@/components/ui/pagination':source+'/ui.tsx'},plugins:[{name:'fixture',setup(build){
  build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
  build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings=window.fixtureStorage;export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>null;export const latestMemberSnapshot=()=>null;export const cacheSnapshot=async()=>{};'}));
  build.onLoad({filter:/\/use-robinhood\.ts$/},()=>({loader:'ts',contents:`
import {emptyEthereum} from './ethereum';import {emptyDownloadProgress} from './download-progress';
const wallets=[{address:'${address}',name:'Robinhood'}],data={...emptyEthereum(),accounts:{'${address}':{balanceWei:'0',block:1,transactions:[]}}};
export function useRobinhood(stake,enabled){return {wallets:enabled?wallets:[],allWallets:wallets,exchanges:[],data,nftHistory:{},tokenHistory:{},loaded:true,busy:false,error:'',status:'',downloadProgress:emptyDownloadProgress(),refresh:async()=>{},saveWallets:()=>true,saveExchanges:()=>true};}` }));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/image-status')){
      const body=route.request().postDataJSON();requests.push(body);
      return route.fulfill({json:{tokens:await cache.status(body.assets)}});
    }
    if(url.pathname.startsWith('/api/portfolio/images/'))return route.fulfill({contentType:'image/webp',body:await readFile(cache.filePath(url.pathname.split('/').pop()))});
    if(url.pathname.endsWith('/robinhood'))assert.fail('fresh saved inventory must not be rescanned for images');
    return route.fulfill({contentType:'text/html',body:'<div id="portfolio-refresh-action"></div><div id="app"></div>'});
  });
  await page.goto('http://127.0.0.1:8997/');
  await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.evaluate(()=>{
    const values=new Map();window.fixtureStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),keys:()=>[...values.keys()],setItems:(items,remove=[])=>{for(const key of remove)values.delete(key);for(const [key,value]of Object.entries(items))values.set(key,value);}};
    window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
  });
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  await page.getByRole('button',{name:'Open Assets',exact:true}).click();
  await page.getByRole('button',{name:'Open NFTs',exact:true}).click();
  const card=page.locator('[data-owned-asset="'+id+'"]'),image=card.getByRole('img',{name:'MallardOrder',exact:true});
  await image.waitFor();await page.waitForFunction(()=>document.querySelector('.portfolio-asset-image')?.naturalWidth===3);
  assert.match(await image.getAttribute('src'),/^https:\/\/api\.tdsp\.online\/api\/portfolio\/images\/[a-f0-9]{64}\.webp$/);
  assert.ok(requests.some(body=>body.assets.includes(id)));assert.equal(calls.length,3);
  await card.getByRole('button',{name:'View MallardOrder details',exact:true}).click();
  const details=page.locator('#portfolio-owned-asset-overlay');await details.getByRole('img',{name:'MallardOrder'}).waitFor();
  assert.match(await details.innerText(),/Robinhood Chain · ERC-721[\s\S]*Balance: 1 MallardOrder[\s\S]*5441/);
  assert.equal(await page.evaluate(address=>JSON.stringify(window.inventory['robinhood:'+address].assets[0])===window.assetBefore,address),true,'repairing artwork does not change saved ownership or balances');
  for(const width of [1200,390]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  assert.deepEqual(errors,[]);
  console.log('PASS: saved MallardOrder #5441 with no image resolves artwork 5437 through the backend cache, renders in NFTs and asset details, and retains balances on desktop/mobile.');
}finally{await browser.close();await rm(directory,{recursive:true,force:true});}
