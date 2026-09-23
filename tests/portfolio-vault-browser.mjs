// Offline integration test. Pass a Playwright module path when it is not installed locally.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {generateKeyPairSync,sign} from 'node:crypto';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {encode}=await import('../delegators/portfolio-src/node_modules/cborg/cborg.js');
const {bech32}=await import('../delegators/portfolio-src/node_modules/@scure/base/index.js');
const {blake2b}=await import('../delegators/portfolio-src/node_modules/@noble/hashes/blake2.js');
const {chromium}=await import(process.argv[2]||'playwright');
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const pub=new Uint8Array(publicKey.export({type:'spki',format:'der'}).subarray(-32));
const raw=Uint8Array.from([0xe1,...blake2b(pub,{dkLen:28})]);
const stake=bech32.encode('stake',bech32.toWords(raw));
const bundle=await build({stdin:{contents:"export * from './vault.ts';",resolveDir:path.resolve('delegators/portfolio-src')},bundle:true,write:false,format:'esm',platform:'browser'});
const browser=await chromium.launch({channel:'chrome',headless:true});
let stored={revision:null,payload:null,expires_at:Date.now()+604800000},revision=0,conflict=false;
const uploads=[];
try{
  const page=await browser.newPage();
  await page.exposeFunction('approve',payload=>{
    const headers=encode(new Map([[1,-8],['address',raw]])),body=Buffer.from(payload,'hex');
    const signature=sign(null,encode(['Signature1',headers,new Uint8Array(),body]),privateKey);
    return {signature:Buffer.from(encode([headers,new Map([['hashed',false]]),body,signature])).toString('hex'),key:Buffer.from(encode(new Map([[1,1],[3,-8],[-1,6],[-2,pub]]))).toString('hex')};
  });
  await page.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.pathname==='/vault-test.js')return route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text});
    if(url.pathname==='/api/portfolio/session')return route.fulfill({json:{stake_address:stake}});
    if(url.pathname==='/api/portfolio/vault'){
      if(request.method()==='POST'){
        const body=request.postDataJSON();uploads.push(body);
        if(conflict||body.revision!==stored.revision)return route.fulfill({status:409,json:{error:'conflict'}});
        if(body.action==='delete'){stored={revision:null,payload:null,expires_at:Date.now()+604800000};return route.fulfill({json:{deleted:true}});}
        stored={...stored,payload:body.payload,revision:String(++revision)};
        return route.fulfill({json:{revision:stored.revision,expires_at:stored.expires_at}});
      }
      return route.fulfill({json:stored});
    }
    return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Vault test</title>'});
  });
  const start=async()=>{await page.goto('http://127.0.0.1:8999/');await page.evaluate(async()=>{window.vault=await import('/vault-test.js');sessionStorage.setItem('tdsp-raffle-session-delegator','test-session');});};
  await start();
  const setting='tdsp-member-cex-v1:'+stake;
  await page.evaluate(async({stake,setting})=>{
    localStorage.setItem(setting,JSON.stringify([{name:'Private exchange label',address:'legacy'}]));
    await window.vault.unlockPortfolio({signData:window.approve});
    if(!window.vault.vaultUnlocked(stake))throw new Error('not unlocked');
    window.vault.portfolioSettings.setItem(setting,'private-updated-label');
    await window.vault.flushVault();
    if(localStorage.getItem(setting)!==null)throw new Error('legacy plaintext retained');
  },{stake,setting});
  assert.ok(uploads.length>=2);
  assert.ok(!JSON.stringify(uploads).includes('private-updated-label'));
  assert.deepEqual(Object.keys(uploads[0]).sort(),['payload','revision']);
  await start();
  assert.equal(await page.evaluate(()=>window.vault.vaultUnlocked()),false);
  await page.evaluate(()=>window.vault.unlockPortfolio({signData:window.approve}));
  assert.equal(await page.evaluate(setting=>window.vault.portfolioSettings.getItem(setting),setting),'private-updated-label');
  conflict=true;
  assert.equal(await page.evaluate(async setting=>{window.vault.portfolioSettings.setItem(setting,'do-not-overwrite');try{await window.vault.flushVault();return false;}catch{return !window.vault.vaultUnlocked();}},setting),true);
  conflict=false;
  await start();
  assert.equal(await page.evaluate(async()=>{
    const unlock=window.vault.unlockPortfolio({signData:async payload=>{window.dispatchEvent(new Event('tdsp:portfolio-session-expired'));return window.approve(payload);}});
    try{await unlock;return false;}catch{return !window.vault.vaultUnlocked();}
  }),true);
  const beforeLocal=uploads.length;
  await page.evaluate(async({stake,setting})=>{await window.vault.openLocalPortfolio(stake);window.vault.portfolioSettings.setItem(setting,'local-only-label');await window.vault.flushVault();}, {stake,setting});
  assert.equal(uploads.length,beforeLocal,'local saves must not upload a cache');
  await page.evaluate(async({stake,setting})=>{
    await window.vault.switchStorage('remote',stake,{signData:window.approve},'delegator',false);
    if(window.vault.portfolioSettings.getItem(setting)!=='private-updated-label')throw new Error('remote copy unexpectedly overwritten');
    await window.vault.switchStorage('local',stake,null,'delegator',false);
    if(window.vault.portfolioSettings.getItem(setting)!=='local-only-label')throw new Error('local copy missing');
    await window.vault.switchStorage('remote',stake,{signData:window.approve},'delegator',true);
    if(window.vault.portfolioSettings.getItem(setting)!=='local-only-label')throw new Error('explicit copy failed');
    await window.vault.deleteStoredCache('local',stake);
    if(!window.vault.vaultUnlocked(stake))throw new Error('deleting local locked remote');
    await window.vault.deleteStoredCache('remote',stake);
    if(window.vault.vaultUnlocked())throw new Error('deleted active cache still writable');
    await window.vault.openLocalPortfolio(stake);
    if(window.vault.portfolioSettings.getItem(setting)!==null)throw new Error('deleted local cache returned');
  },{stake,setting});
  assert.equal(stored.payload,null);
  await page.evaluate(async stake=>{
    window.TDSPRuntime={isMobileDevice:()=>true};
    let rejected=false;try{await window.vault.openLocalPortfolio(stake);}catch{rejected=true;}
    if(!rejected||window.vault.vaultUnlocked())throw new Error('mobile local mode allowed');
    await window.vault.unlockPortfolio({signData:window.approve});
    if(!window.vault.vaultUnlocked(stake)||window.vault.storageMode()!=='remote')throw new Error('mobile remote mode blocked');
    rejected=false;try{await window.vault.switchStorage('local',stake,null,'delegator',true);}catch{rejected=true;}
    if(!rejected||window.vault.storageMode()!=='remote')throw new Error('mobile switched to local mode');
  },stake);
  console.log('PASS: encryption, storage switching/deletion, mobile remote access and mobile local restriction.');
}finally{await browser.close();}
