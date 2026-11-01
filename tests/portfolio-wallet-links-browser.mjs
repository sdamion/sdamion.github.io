import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url)),{build}=require('esbuild');
const {encode}=await import('../delegators/portfolio-src/node_modules/cborg/cborg.js');
const {bech32}=await import('../delegators/portfolio-src/node_modules/@scure/base/index.js');
const {blake2b}=await import('../delegators/portfolio-src/node_modules/@noble/hashes/blake2.js');
const {chromium}=await import(process.argv[2]);
const pair=generateKeyPairSync('ed25519'),pub=new Uint8Array(pair.publicKey.export({type:'spki',format:'der'}).subarray(-32)),raw=Uint8Array.from([0xe1,...blake2b(pub,{dkLen:28})]),stake=bech32.encode('stake',bech32.toWords(raw));
const outsider=generateKeyPairSync('ed25519');
const bundle=await build({stdin:{resolveDir:path.resolve('delegators/portfolio-src'),contents:"export * from './vault'; export {mountPortfolio} from './entry';"},bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'fixture',setup(build){build.onLoad({filter:/\/App\.tsx$/},()=>({loader:'tsx',contents:'export default function Home(){return <p>Test Portfolio</p>;}'}));}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
let stored={revision:null,payload:null,expires_at:Date.now()+365*86400000},revision=0,unavailable=false,loseAck=false,supportsLinks=true;
const uploads=[],chunks=new Map(),acks=new Map(),approvals=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}});page.setDefaultTimeout(15000);
 await page.exposeFunction('approve',(payload,variant)=>{
  const signing=variant===99?outsider:pair,publicBytes=new Uint8Array(signing.publicKey.export({type:'spki',format:'der'}).subarray(-32));
  const headers=encode(new Map([[1,-8],['address',raw],...(variant?[[3,'application/tdsp-'+variant]]:[])])),body=Buffer.from(payload,'hex');
  const signature=sign(null,encode(['Signature1',headers,new Uint8Array(),body]),signing.privateKey);approvals.push({variant,signature:Buffer.from(signature).toString('hex')});
  return {signature:Buffer.from(encode([headers,new Map([['hashed',false]]),body,signature])).toString('hex'),key:Buffer.from(encode(new Map([[1,1],[3,-8],[-1,6],[-2,publicBytes]]))).toString('hex')};
 });
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.pathname==='/fixture.js')return route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text});
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
  if(url.pathname.endsWith('.toml'))return route.fulfill({contentType:'text/plain',body:await readFile('.'+url.pathname,'utf8')});
  if(url.pathname==='/api/portfolio/session')return route.fulfill({json:{stake_address:stake}});
  if(url.pathname==='/api/portfolio/vault'){
   if(request.method()==='GET')return route.fulfill({json:{...stored,checkpoint_version:2,...(supportsLinks?{wallet_link_version:1}:{})}});
   const body=request.postDataJSON();
   if(body.action==='chunks')return route.fulfill({json:{chunks:body.ids.map(id=>({id,payload:chunks.get(id)}))}});
   uploads.push(body);
   if(unavailable)return route.fulfill({status:503,json:{error:'Unavailable'}});
   if(acks.has(body.commit_id))return route.fulfill({json:acks.get(body.commit_id)});
   if(body.revision!==stored.revision)return route.fulfill({status:409,json:{error:'Conflict'}});
   stored={...stored,payload:body.payload,revision:String(++revision)};for(const chunk of body.chunks||[])chunks.set(chunk.id,chunk.payload);
   const result={revision:stored.revision,expires_at:stored.expires_at};acks.set(body.commit_id,result);
   if(loseAck){loseAck=false;return route.abort('failed');}return route.fulfill({json:result});
  }
  return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>'});
 });
 async function start(){await page.goto('http://127.0.0.1:8999/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});await page.evaluate(async()=>{
  window.vault=await import('/fixture.js');window.wallet=variant=>({signData:payload=>window.approve(payload,variant)});sessionStorage.setItem('tdsp-raffle-session-delegator','test-session');
  window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};
 });}
 const setting='tdsp-member-cex-v1:'+stake;
 await start();
 await page.evaluate(async()=>{let rejected=false;try{await window.vault.linkPortfolioWallet(window.wallet(1));}catch{rejected=true;}if(!rejected)throw Error('linking locked cache allowed');});
 await page.evaluate(async({stake,setting})=>{await window.vault.unlockPortfolio(window.wallet(0));window.vault.portfolioSettings.setItem(setting,'private-remote-label');await window.vault.cacheSnapshot(stake+'::fixture',{groups:{},infos:[],txs:[{tx_hash:'a',block_time:1700000000,block_height:1}],facts:{a:{hash:'a',wallets:[]}},markets:{},history:{},complete:true});await window.vault.flushVault();},{stake,setting});
 const legacy=structuredClone(stored),legacyChunks=uploads.at(-1).chunk_ids;
 await page.evaluate(async()=>{let rejected=false;try{await window.vault.linkPortfolioWallet(window.wallet(99));}catch{rejected=true;}if(!rejected)throw Error('wrong stake linked');});assert.deepEqual(stored,legacy);
 supportsLinks=false;const approvalsBefore=approvals.length;
 await page.evaluate(async()=>{let rejected=false;try{await window.vault.linkPortfolioWallet(window.wallet(1));}catch(error){rejected=error.message.includes('Update the backend');}if(!rejected)throw Error('old backend allowed');});assert.equal(approvals.length,approvalsBefore);assert.deepEqual(stored,legacy);supportsLinks=true;
 await page.evaluate(()=>{window.choice=1;window.vault.mountPortfolio(document.getElementById('root'),{getWallet:(reconnect,stake,linkAnother)=>{window.linkChooser=linkAnother;return window.wallet(linkAnother?window.choice:0);}});});
 await page.getByRole('button',{name:/Portfolio storage:/}).click();const settings=page.locator('#portfolio-storage-overlay');
 await settings.getByRole('button',{name:'Link another wallet app',exact:true}).click();await settings.getByText('Wallet app linked. It can now unlock this saved Portfolio.',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.linkChooser),true);assert.equal(stored.payload.version,2);assert.equal(stored.payload.wallet_keys.length,2);
 assert.ok(uploads.at(-1).chunk_ids.every(id=>!legacyChunks.includes(id)),'legacy chunks are re-encrypted with the random data key');
 for(const file of ['shared/portfolio-i18n-keys.js','shared/portfolio-i18n.js','shared/i18n.js'])await page.addScriptTag({content:await readFile(file,'utf8')});
 for(const language of ['nl','ja','es','en']){
  await page.evaluate(language=>window.TDSPI18n.setLanguage(language),language);
  const label=await page.evaluate(()=>window.TDSPI18n.translateText('Link another wallet app'));await settings.getByRole('button',{name:label,exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.vault.linkedWalletCount()),2);assert.equal(await page.evaluate(setting=>window.vault.portfolioSettings.getItem(setting),setting),'private-remote-label');
 }
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await settings.screenshot({path:'/tmp/portfolio-wallet-links-'+width+'.png'});}
 await start();await page.evaluate(async({stake,setting})=>{await window.vault.unlockPortfolio(window.wallet(1));if(window.vault.portfolioSettings.getItem(setting)!=='private-remote-label')throw Error('linked app did not restore legacy data');if(!window.vault.latestMemberSnapshot(stake+'::fixture').facts.a)throw Error('migrated checkpoint missing');},{stake,setting});
 const ids=uploads.at(-1).chunk_ids;await page.evaluate(()=>window.vault.linkPortfolioWallet(window.wallet(2)));assert.equal(stored.payload.wallet_keys.length,3);assert.deepEqual(uploads.at(-1).chunks,[]);assert.deepEqual(uploads.at(-1).chunk_ids,ids,'adding an app to an existing linked vault reuses encrypted chunks');
 const beforeDuplicate=uploads.length;assert.equal(await page.evaluate(()=>window.vault.linkPortfolioWallet(window.wallet(2))),false);assert.equal(uploads.length,beforeDuplicate);
 const unlinked=structuredClone(stored);await page.evaluate(async setting=>{let rejected=false;try{await window.vault.unlockPortfolio(window.wallet(8));}catch{rejected=true;}if(!rejected||window.vault.vaultUnlocked())throw Error('unlinked app unlocked data');await window.vault.unlockPortfolio(window.wallet(0));if(window.vault.portfolioSettings.getItem(setting)!=='private-remote-label')throw Error('original app lost access');},setting);assert.deepEqual(stored,unlinked);
 const saved=structuredClone(stored);unavailable=true;
 await page.evaluate(async()=>{let rejected=false;try{await window.vault.linkPortfolioWallet(window.wallet(3));}catch{rejected=true;}if(!rejected||window.vault.linkedWalletCount()!==3)throw Error('failed upload reported a linked app');});assert.deepEqual(stored,saved);
 unavailable=false;await page.evaluate(()=>window.vault.flushVault());assert.equal(stored.payload.wallet_keys.length,4);assert.equal(await page.evaluate(()=>window.vault.linkedWalletCount()),4);
 loseAck=true;await page.evaluate(async()=>{try{await window.vault.linkPortfolioWallet(window.wallet(4));}catch{}});const pending=uploads.at(-1).commit_id;await page.evaluate(()=>window.vault.flushVault());assert.equal(uploads.at(-1).commit_id,pending);assert.equal(stored.payload.wallet_keys.length,5);
 await start();await page.evaluate(async()=>{await window.vault.unlockPortfolio(window.wallet(4));window.pendingApproval=null;window.delayed={signData:payload=>new Promise(resolve=>window.pendingApproval=()=>window.approve(payload,5).then(resolve))};window.linking=window.vault.linkPortfolioWallet(window.delayed).then(()=>false,()=>true);});
 await page.waitForFunction(()=>!!window.pendingApproval);const cancelled=structuredClone(stored);await page.evaluate(async()=>{window.dispatchEvent(new Event('tdsp:portfolio-session-expired'));window.pendingApproval();if(!await window.linking)throw Error('logout did not cancel linking');});assert.deepEqual(stored,cancelled);
 await page.evaluate(async stake=>{await window.vault.unlockPortfolio(window.wallet(0));const generation=window.vault.walletLinkGeneration();window.vault.lockVault();await window.vault.unlockPortfolio(window.wallet(0));let rejected=false;try{await window.vault.linkPortfolioWallet(window.wallet(7),stake,generation);}catch{rejected=true;}if(!rejected)throw Error('stale wallet picker linked a new unlock generation');},stake);
 const beforeLocal=uploads.length;
 await page.evaluate(async({stake,setting})=>{await window.vault.openLocalPortfolio(stake,window.wallet(0));window.vault.portfolioSettings.setItem(setting,'private-local-label');await window.vault.flushVault();await window.vault.linkPortfolioWallet(window.wallet(1));window.vault.lockVault();await window.vault.openLocalPortfolio(stake,window.wallet(1));if(window.vault.portfolioSettings.getItem(setting)!=='private-local-label')throw Error('linked app could not unlock local cache');},{stake,setting});assert.equal(uploads.length,beforeLocal);assert.deepEqual(stored,cancelled,'local linking never changes the remote copy');
 await page.evaluate(async({stake,setting})=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='members')throw Error('Disk full');return put.apply(this,args);};let rejected=false;try{await window.vault.linkPortfolioWallet(window.wallet(2));}catch{rejected=true;}finally{IDBObjectStore.prototype.put=put;}if(!rejected||window.vault.linkedWalletCount()!==2)throw Error('failed local write reported linking success');window.vault.lockVault();await window.vault.openLocalPortfolio(stake,window.wallet(0));if(window.vault.portfolioSettings.getItem(setting)!=='private-local-label'||window.vault.linkedWalletCount()!==2)throw Error('aborted local linking changed saved data');},{stake,setting});
 const serialized=JSON.stringify(uploads);assert.equal(serialized.includes('private-remote-label'),false);assert.equal(serialized.includes('private-local-label'),false);for(const approval of approvals)assert.equal(serialized.includes(approval.signature),false);
 console.log('PASS: real wallet crypto, legacy local/remote migration, original and linked app access, chunk rekey/reuse, wrong-account rejection, backend compatibility, failed/lost uploads, logout cancellation, storage isolation and responsive linking UI.');
}finally{await browser.close();}
