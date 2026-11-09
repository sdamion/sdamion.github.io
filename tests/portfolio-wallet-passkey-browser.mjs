// Real wallet signatures + native WebAuthn PRF + actual backend/vault storage.
// Usage: node tests/portfolio-wallet-passkey-browser.mjs /absolute/path/to/playwright/index.mjs
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const backend=path.resolve(process.argv[3]||'../koios-proxy');
const requireBackend=createRequire(path.join(backend,'package.json')),express=requireBackend('express');
const {createAccountStore,createPortfolioAccountAuth,createPortfolioAuthRouter,fullPortfolioAccess}=await import(path.join(backend,'member-portfolio/account-auth.mjs'));
const {createMemberPortfolioHandler,resolvePortfolioWalletOwner}=await import(path.join(backend,'member-portfolio/index.mjs'));
const {createVaultStore}=await import(path.join(backend,'member-portfolio/vault-store.mjs'));
const {installPortfolioBodyParsers}=await import(path.join(backend,'member-portfolio/body-parser.mjs'));
const {createRaffleService}=await import(path.join(backend,'raffle.js'));
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url)),{build}=require('esbuild');
const {encode}=await import('../delegators/portfolio-src/node_modules/cborg/cborg.js');
const {bech32}=await import('../delegators/portfolio-src/node_modules/@scure/base/index.js');
const {blake2b}=await import('../delegators/portfolio-src/node_modules/@noble/hashes/blake2.js');
const source=path.resolve('delegators/portfolio-src');
const bundle=await build({stdin:{resolveDir:source,contents:"export * from './entry'; export {portfolioSettings,cacheSnapshot,latestMemberSnapshot,flushVault,switchStorage} from './vault'; export {loadLocal} from './local-store';"},bundle:true,write:false,format:'esm',jsx:'automatic',target:'es2020',define:{'process.env.NODE_ENV':'"production"'},alias:{'@/lib/portfolio':source+'/core.ts','@/lib/portfolio-cache':source+'/cache.ts','@/components/ui/input':source+'/ui.tsx','@/components/ui/table':source+'/ui.tsx','@/components/ui/pagination':source+'/ui.tsx'}});
const {chromium}=await import(process.argv[2]),directory=await mkdtemp(path.join(os.tmpdir(),'portfolio-wallet-passkey-'));
const pair=generateKeyPairSync('ed25519'),pub=new Uint8Array(pair.publicKey.export({type:'spki',format:'der'}).subarray(-32)),raw=Uint8Array.from([0xe1,...blake2b(pub,{dkLen:28})]),stake=bech32.encode('stake',bech32.toWords(raw));
function approve(body){const headers=encode(new Map([[1,-8],['address',raw]])),signature=sign(null,encode(['Signature1',headers,new Uint8Array(),body]),pair.privateKey);return {signature:Buffer.from(encode([headers,new Map([['hashed',false]]),body,signature])).toString('hex'),key:Buffer.from(encode(new Map([[1,1],[3,-8],[-1,6],[-2,pub]]))).toString('hex')};}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const mode of ['remote','local']){
 const app=express(),server=await new Promise(resolve=>{const server=app.listen(0,'localhost',()=>resolve(server));}),origin=`http://localhost:${server.address().port}`;
 const store=createAccountStore(path.join(directory,mode,'accounts.json')),vaultStore=createVaultStore({directory:path.join(directory,mode,'vaults')});
 const raffle=createRaffleService({sessionSecret:'real-wallet-session-test-secret',loadPool:async()=>({pool_id:'pool1fixture',delegators:[{stake_address:stake,amount_lovelace:'100000000'}]}),loadRaffles:async()=>null,saveRaffles:async()=>{}});
 const challenge=await raffle.issueChallenge({role:'delegator',address:stake,clientId:'browser'}),signed=approve(Buffer.from(challenge.payload));
 const walletLogin=await raffle.authenticate({challengeId:challenge.challenge_id,address:stake,clientId:'browser',...signed});
 const auth=createPortfolioAccountAuth({store,secret:'passkey-wallet-test-secret-'.repeat(3),origins:[origin],rpID:'localhost',verifyWallet:async token=>{const session=await raffle.verifyPortfolioSession(token);return {owner:await resolvePortfolioWalletOwner(session),binding:session.id};}});
 const authenticate=token=>token.startsWith('pa1.')?auth.verify(token):raffle.verifyPortfolioSession(token);
 installPortfolioBodyParsers(app,{authenticate:req=>authenticate(String(req.headers.authorization||'').slice(7)),sendAuthError:(res,error)=>res.status(error.status||500).json({error:error.message})});
 app.use('/api/portfolio/auth',createPortfolioAuthRouter(auth,{rateLimit:()=>true,sendError:(res,error)=>res.status(error.status||500).json({error:error.message})}));
 const handler=createMemberPortfolioHandler({authenticate,getPortfolioAccess:()=>fullPortfolioAccess(),vaultStore,renewSession:token=>token.startsWith('pa1.')?auth.renew(token):raffle.renewSession(token)});
 app.all('/api/portfolio/:operation',async(req,res)=>{if(!['session','vault'].includes(req.params.operation))return res.status(503).json({error:'Fixture: provider offline'});try{const response=await handler({operation:req.params.operation,method:req.method,body:req.body,token:String(req.headers.authorization||'').slice(7)});res.status(response.status).set(Object.fromEntries(response.headers)).send(await response.text());}catch(error){res.status(error.status||500).json({error:error.message});}});
 app.get('/fixture.js',(req,res)=>res.type('application/javascript').send(bundle.outputFiles[0].text));
 app.get('/fixture',(req,res)=>res.type('text/html').send('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/shared/styles.css"><link rel="stylesheet" href="/delegators/raffle.css"><div id="portfolio-refresh-action"></div><div id="root"></div>'));
 app.use(express.static(process.cwd()));
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));
 await page.exposeFunction('approve',payload=>approve(Buffer.from(payload,'hex')));
 try{
  const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',ctap2Version:'ctap2_1',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,hasPrf:true,automaticPresenceSimulation:true}});
  await page.goto(origin+'/fixture');
  async function load(){await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});await page.evaluate(async()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;overlay.append(...options.bodyNodes);document.body.append(overlay);return {overlay};};window.portfolio=await import('/fixture.js');window.wallet={signData:payload=>{window.walletCalls=(window.walletCalls||0)+1;if(window.walletUnavailable)throw new Error('Wallet must not be requested during passkey login');return window.approve(payload);}};});}
  await load();
  await page.evaluate(async({token,stake,mode})=>{
   sessionStorage.setItem('tdsp-raffle-session-delegator',token);localStorage.setItem('tdsp-portfolio-storage:'+stake,mode);localStorage.setItem('tdsp-portfolio-setup-v1:'+stake,'done');
   await window.portfolio.switchStorage(mode,stake,window.wallet,'delegator',false);
   window.portfolio.portfolioSettings.setItem('tdsp-member-wallets-v1:'+stake,JSON.stringify([{address:stake,label:'Existing stake wallet'}]));
   window.portfolio.portfolioSettings.setItem('tdsp-member-basis:'+stake,JSON.stringify({private:'original '+mode+' cache'}));
   await window.portfolio.cacheSnapshot(stake+'::'+stake,{infos:[],txs:[],facts:{},markets:{},adaUsd:1,history:{'2026-01-01':0.42},updated:'2026-11-01',complete:true,priceAt:null,groups:{[stake]:[]},swapGroups:{}});
   await window.portfolio.flushVault();
   window.portfolio.mountPortfolio(document.getElementById('root'),{getWallet:()=>window.wallet});
  },{token:walletLogin.token,stake,mode});
  await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();
  await page.getByRole('button',{name:'Add passkey to current Portfolio',exact:true}).click();
  try{await page.getByText('Passkey linked to this storage location. Link it to your other storage location separately if you use both.',{exact:true}).waitFor();}catch(error){throw new Error(JSON.stringify({mode,errors,text:await page.locator('body').innerText()}),{cause:error});}
  const records=(await store.read()).accounts;assert.equal(records.length,1);assert.equal(records[0].wallet_owner,stake);assert.equal(records[0].credentials.length,1);
  const payload=mode==='remote'?(await vaultStore.open(stake)).payload:await page.evaluate(async stake=>(await window.portfolio.loadLocal(stake)).data.payload,stake);
  assert.equal(payload.version,2);assert.equal(payload.wallet_keys.length,2);assert.ok(!JSON.stringify(payload).includes('original '+mode+' cache'));
  const walletCalls=await page.evaluate(()=>window.walletCalls);
  await page.evaluate(()=>{sessionStorage.removeItem('tdsp-raffle-session-delegator');window.walletUnavailable=true;window.dispatchEvent(new Event('tdsp:portfolio-session-expired'));});
  await page.getByRole('button',{name:'Sign in with passkey',exact:true}).click();
  await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();
  async function assertCache(){assert.deepEqual(await page.evaluate(stake=>({wallets:JSON.parse(window.portfolio.portfolioSettings.getItem('tdsp-member-wallets-v1:'+stake)),marker:JSON.parse(window.portfolio.portfolioSettings.getItem('tdsp-member-basis:'+stake)).private,history:window.portfolio.latestMemberSnapshot(stake+'::'+stake)?.history['2026-01-01']}),stake),{wallets:[{address:stake,label:'Existing stake wallet'}],marker:'original '+mode+' cache',history:0.42});}
  await assertCache();assert.equal(await page.evaluate(()=>window.walletCalls),walletCalls);
  const identity=await page.evaluate(async()=>{const response=await fetch('/api/portfolio/session',{headers:{Authorization:'Bearer '+sessionStorage.getItem('tdsp-portfolio-session')}});return response.json();});assert.equal(identity.stake_address,stake);assert.equal(identity.member_id,stake);
  await page.reload();await load();await page.evaluate(()=>{window.walletUnavailable=true;window.portfolio.mountPortfolio(document.getElementById('root'),{getWallet:()=>window.wallet});});
  await page.getByRole('button',{name:'Sign in with passkey',exact:true}).click();await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();await assertCache();assert.equal(await page.evaluate(()=>window.walletCalls||0),0);
  // The original wallet still unlocks the same rekeyed cache after the passkey is linked.
  await page.evaluate(token=>{sessionStorage.removeItem('tdsp-portfolio-session');sessionStorage.setItem('tdsp-raffle-session-delegator',token);},walletLogin.token);
  await page.reload();await load();await page.evaluate(()=>window.portfolio.mountPortfolio(document.getElementById('root'),{getWallet:()=>window.wallet}));
  await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();await assertCache();assert.deepEqual(errors,[]);
  console.log('PASS: '+mode+' wallet cache retains stake, wallets, settings and snapshot after passkey linking, wallet-free login, reload and original-wallet login.');
 }finally{await context.close();await new Promise(resolve=>server.close(resolve));}
}}finally{await browser.close();await rm(directory,{recursive:true,force:true});}
