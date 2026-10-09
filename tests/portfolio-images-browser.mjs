import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const id='a'.repeat(56)+'01',image='/api/portfolio/images/'+'b'.repeat(64)+'.gif';
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import App from './App';createRoot(document.getElementById('app')).render(<App memberStake="${stake}" role="admin"/>);`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'image-fixture',setup(build){
  build.onLoad({filter:/\/PortfolioQuickstart\.tsx$/},()=>({loader:'tsx',contents:'export function PortfolioQuickstart(){return null;}'}));
  build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:'export const portfolioSettings={getItem:()=>null,setItem:()=>{},keys:()=>[]};export const flushVault=async()=>{};export const storageMode=()=>"local";export const cachedSnapshot=()=>window.fixture;export const latestMemberSnapshot=()=>window.fixture;export const cacheSnapshot=async()=>{};'}));
  build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('useState<Snapshot|null>(null)','useState<Snapshot|null>(window.fixture)').replace('setSnapshot(null);setError','setError').replace('async function refresh(fullScan=false){','async function refresh(fullScan=false){return;')}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[],operations=[];
  let checks=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
    if(url.pathname===image)return route.fulfill({contentType:'image/gif',body:Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64')});
    if(url.pathname.endsWith('/image-status')){
      operations.push('image-status');assert.deepEqual(route.request().postDataJSON(),{assets:[id]});
      return route.fulfill({contentType:'application/json',body:JSON.stringify({tokens:[++checks===1?{token_id:id,state:'pending'}:{token_id:id,state:'cached',cached_image:image}]})});
    }
    if(url.pathname.includes('/api/portfolio/'))operations.push(url.pathname.split('/').pop());
    if(url.hostname!=='127.0.0.1')return route.fulfill({status:404,body:''});
    return route.fulfill({contentType:'text/html',body:'<header><span id="portfolio-refresh-action"></span></header><div id="app"></div>'});
  });
  await page.goto('http://127.0.0.1:8998/');
  await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.evaluate(id=>{
    window.fixture={groups:{},infos:[{address:'wallet',balance:'0',utxo_set:[{tx_hash:'holding',tx_index:0,value:'0',asset_list:[{policy_id:id.slice(0,56),asset_name:id.slice(56),quantity:'1',decimals:0}]}]}],txs:[],facts:{},markets:{[id]:{token_id:id,name:'Cached test asset',is_nft:true,decimals:0,image:'ipfs://QmMissingImage',price_by_usd:10}},adaUsd:0.5,history:{},complete:true};
    window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
  },id);
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  await page.getByRole('button',{name:'Open Assets',exact:true}).click();
  await page.getByRole('button',{name:'Open NFTs',exact:true}).click();
  await page.waitForFunction(image=>[...document.images].some(img=>img.src.endsWith(image)&&img.complete&&img.naturalWidth>0),image);
  assert.equal(checks,2,'the completed background download appears without refreshing the portfolio');
  assert.deepEqual(operations,['image-status','image-status'],'no price, metadata or transaction re-scan');
  const asset=page.getByRole('button',{name:'View Cached test asset details',exact:true});
  assert.equal(await asset.locator('img').count(),1);
  for(const width of [1200,390]){
    await page.setViewportSize({width,height:900});
    assert.equal(await asset.locator('img').evaluate(img=>img.naturalWidth>0),true);
    await asset.screenshot({path:`/tmp/tdsp-cached-image-${width}.png`});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: background Portfolio images appear automatically on desktop and mobile without re-scanning prices or transactions.');
}finally{await browser.close();}
