import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const {encode}=await import('../delegators/portfolio-src/node_modules/cborg/cborg.js');
const {bech32}=await import('../delegators/portfolio-src/node_modules/@scure/base/index.js');
const {blake2b}=await import('../delegators/portfolio-src/node_modules/@noble/hashes/blake2.js');
const {chromium}=await import(process.argv[2]);
const pair=generateKeyPairSync('ed25519'),pub=new Uint8Array(pair.publicKey.export({type:'spki',format:'der'}).subarray(-32));
const raw=Uint8Array.from([0xe1,...blake2b(pub,{dkLen:28})]),stake=bech32.encode('stake',bech32.toWords(raw));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',error=>errors.push(error.message));
 await page.exposeFunction('approve',payload=>{
  const headers=encode(new Map([[1,-8],['address',raw]])),body=Buffer.from(payload,'hex');
  const signature=sign(null,encode(['Signature1',headers,new Uint8Array(),body]),pair.privateKey);
  return {signature:Buffer.from(encode([headers,new Map([['hashed',false]]),body,signature])).toString('hex'),key:Buffer.from(encode(new Map([[1,1],[3,-8],[-1,6],[-2,pub]]))).toString('hex')};
 });
 let stored={revision:null,payload:null,expires_at:Date.now()+365*86400000},stallVault=false;const chunks=new Map();
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),operation=url.pathname.split('/').pop();
  if(url.pathname==='/app.js')return route.fulfill({contentType:'text/javascript',body:await readFile('delegators/portfolio/app.js','utf8')});
  if(operation==='session')return route.fulfill({json:{stake_address:stake}});
  if(operation==='vault'){
   if(stallVault){await new Promise(resolve=>setTimeout(resolve,300));return route.fulfill({status:503,json:{error:'Synthetic delayed vault'}}).catch(()=>{});}
   if(request.method()==='GET')return route.fulfill({json:{...stored,checkpoint_version:2,wallet_link_version:1}});
   const body=request.postDataJSON();
   if(body.action==='chunks')return route.fulfill({json:{chunks:body.ids.map(id=>({id,payload:chunks.get(id)}))}});
   stored={...stored,revision:String(Number(stored.revision)+1),payload:body.payload};
   for(const row of body.chunks||[])chunks.set(row.id,row.payload);
   return route.fulfill({json:{revision:stored.revision,expires_at:stored.expires_at}});
  }
  if(url.pathname.startsWith('/api/portfolio/'))return route.fulfill({status:503,json:{error:'Synthetic upstream unavailable'}});
  return route.fulfill({contentType:'text/html',body:'<!doctype html><div id="portfolio-refresh-action"></div><div id="root"></div>'});
 });
 async function mount(){
  await page.goto('http://127.0.0.1:8999/');
  await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
  await page.evaluate(async stake=>{
   sessionStorage.setItem('tdsp-raffle-session-delegator','synthetic');
   localStorage.setItem('tdsp-portfolio-setup-v1:'+stake,'done');
   window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;overlay.append(...options.bodyNodes);document.body.append(overlay);return {overlay};};
   window.portfolio=await import('/app.js');
   window.portfolio.mountPortfolio(document.getElementById('root'),{getWallet:()=>({signData:payload=>window.approve(payload)})});
  },stake);
 }
 await mount();
 await page.getByRole('button',{name:'Open Portfolio',exact:true}).click();
 try{await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();}catch(error){throw new Error(JSON.stringify({errors,text:await page.locator('body').innerText()}),{cause:error});}
 assert.deepEqual(errors,[]);
 assert.equal(stored.payload.version,1);
 await mount();
 await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 const saved=structuredClone(stored);
 await page.addInitScript(()=>{
  const timeout=window.setTimeout.bind(window);
  window.setTimeout=(callback,ms,...args)=>timeout(callback,ms===75000?100:ms,...args);
 });
 stallVault=true;await mount();
 await page.getByText('Portfolio vault request timed out after 75 seconds. Your cached data is retained; please retry.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Unlock Portfolio',exact:true}).waitFor();
 assert.deepEqual(stored,saved,'a timed-out unlock never resets the encrypted cache');
 stallVault=false;
 await page.getByRole('button',{name:'Unlock Portfolio',exact:true}).click();
 await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(stored.payload,saved.payload);
 console.log('PASS: shipped Portfolio renders after wallet approval and cache restoration, retains data on a vault timeout, and unlocks successfully on retry.');
}finally{await browser.close();}
