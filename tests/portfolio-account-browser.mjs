// Usage: node tests/portfolio-account-browser.mjs /absolute/path/to/playwright/index.mjs
// WebAuthn and encryption use Chrome's real implementations; public chain providers are offline fixtures.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const backend=path.resolve(process.argv[3]||'../koios-proxy');
const requireBackend=createRequire(path.join(backend,'package.json')),express=requireBackend('express');
const {createAccountStore,createPortfolioAccountAuth,createPortfolioAuthRouter,fullPortfolioAccess}=await import(path.join(backend,'member-portfolio/account-auth.mjs'));
const {createMemberPortfolioHandler}=await import(path.join(backend,'member-portfolio/index.mjs'));
const {createVaultStore}=await import(path.join(backend,'member-portfolio/vault-store.mjs'));
const {installPortfolioBodyParsers}=await import(path.join(backend,'member-portfolio/body-parser.mjs'));
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url)),{build}=require('esbuild');
const source=path.resolve('delegators/portfolio-src');
const bundle=await build({stdin:{resolveDir:source,contents:"export * from './entry'; export {portfolioSettings,flushVault,switchStorage} from './vault';"},bundle:true,write:false,format:'esm',jsx:'automatic',target:'es2020',define:{'process.env.NODE_ENV':'"production"'},alias:{'@/lib/portfolio':source+'/core.ts','@/lib/portfolio-cache':source+'/cache.ts','@/components/ui/input':source+'/ui.tsx','@/components/ui/table':source+'/ui.tsx','@/components/ui/pagination':source+'/ui.tsx'}});
const {chromium}=await import(process.argv[2]),directory=await mkdtemp(path.join(os.tmpdir(),'portfolio-account-browser-'));
const app=express();
const server=await new Promise(resolve=>{const server=app.listen(0,'localhost',()=>resolve(server));}),origin=`http://localhost:${server.address().port}`;
const store=createAccountStore(path.join(directory,'accounts.json'));
const auth=createPortfolioAccountAuth({store,secret:'browser-test-secret-'.repeat(3),origins:[origin],rpID:'localhost'});
const vaultStore=createVaultStore({directory:path.join(directory,'vaults')});
installPortfolioBodyParsers(app,{authenticate:req=>auth.verify(String(req.headers.authorization||'').slice(7)),sendAuthError:(res,error)=>res.status(error.status||500).json({error:error.message})});
app.use('/api/portfolio/auth',createPortfolioAuthRouter(auth,{rateLimit:()=>true,sendError:(res,error)=>res.status(error.status||500).json({error:error.message})}));
const handler=createMemberPortfolioHandler({authenticate:token=>auth.verify(token),getPortfolioAccess:()=>fullPortfolioAccess(),vaultStore,renewSession:token=>auth.renew(token)});
app.all('/api/portfolio/:operation',async(req,res)=>{
 if(!['session','vault'].includes(req.params.operation))return res.status(503).json({error:'Fixture: provider offline'});
 try{const response=await handler({operation:req.params.operation,method:req.method,body:req.body,token:String(req.headers.authorization||'').slice(7)});res.status(response.status).set(Object.fromEntries(response.headers)).send(await response.text());}catch(error){res.status(error.status||500).json({error:error.message});}
});
app.get('/fixture.js',(req,res)=>res.type('application/javascript').send(bundle.outputFiles[0].text));
app.get('/fixture',(req,res)=>res.type('text/html').send('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/shared/styles.css"><link rel="stylesheet" href="/delegators/raffle.css"><div id="portfolio-refresh-action"></div><div id="root"></div>'));
app.use(express.static(process.cwd()));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[],requests=[];page.setDefaultTimeout(15000);
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.url().includes('/api/portfolio/'))requests.push(request.postData()||'');});
 const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');
 const {authenticatorId}=await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',ctap2Version:'ctap2_1',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,hasPrf:true,automaticPresenceSimulation:true}});
 await page.goto(origin+'/fixture');
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 async function mount(){if(!await page.evaluate(()=>!!window.TDSPRuntime))await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});await page.evaluate(async()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;overlay.append(...options.bodyNodes);document.body.append(overlay);return {overlay};};window.portfolio=await import('/fixture.js');window.dispose=window.portfolio.mountPortfolio(document.getElementById('root'),{connectWallet:()=>{window.walletRequested=true;}});});}
 await mount();
 assert.equal(await page.getByRole('button',{name:'Continue with X',exact:true}).count(),0);
 for(const path of ['x/start','x/exchange','x/callback']){const response=await page.request.get(origin+'/api/portfolio/auth/'+path);assert.equal(response.status(),404);}
 assert.deepEqual(await (await page.request.get(origin+'/api/portfolio/auth/config')).json(),{passkeys:true});
 await page.getByRole('button',{name:'Create passkey & open Portfolio',exact:true}).click();
 await page.getByRole('button',{name:'Open Portfolio',exact:true}).click();
 await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();
 const account=(await store.read()).accounts[0];assert.ok(account.id.startsWith('portfolio:'));assert.equal(account.credentials.length,1);
 await page.evaluate(async member=>{localStorage.setItem('tdsp-portfolio-setup-v1:'+member,'done');window.portfolio.portfolioSettings.setItem('tdsp-member-basis:'+member,JSON.stringify({private:'account secret marker'}));await window.portfolio.flushVault();},account.id);
 const saved=await vaultStore.open(account.id);assert.ok(saved.payload);assert.ok(!JSON.stringify(saved).includes('account secret marker'));
 const credentials=await cdp.send('WebAuthn.getCredentials',{authenticatorId});assert.equal(credentials.credentials.length,1);
 assert.ok(!requests.some(body=>body.includes('prf')||body.includes('account secret marker')),'PRF output and plaintext never reach auth/vault endpoints');
 // Close the setup guide if it was opened by the full App.
 await page.evaluate(()=>document.getElementById('portfolio-quickstart-overlay')?.remove());
 await page.getByRole('button',{name:'Sign out of Portfolio',exact:true}).click();
 await page.getByRole('button',{name:'Sign in with passkey',exact:true}).click();
 await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();
 assert.equal(await page.evaluate(member=>JSON.parse(window.portfolio.portfolioSettings.getItem('tdsp-member-basis:'+member)).private,account.id),'account secret marker');
 // Switching storage reuses the passkey in memory and performs no wallet request.
 await page.evaluate(async member=>{await window.portfolio.switchStorage('local',member,null,'delegator',true);await window.portfolio.switchStorage('remote',member,null,'delegator',false);},account.id);
 assert.equal(await page.evaluate(member=>JSON.parse(window.portfolio.portfolioSettings.getItem('tdsp-member-basis:'+member)).private,account.id),'account secret marker');
 assert.equal(await page.evaluate(()=>window.walletRequested||false),false);
 for(const width of [1200,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:'/private/tmp/portfolio-account-'+width+'.png',fullPage:true});}
 assert.deepEqual(errors,[]);
 // A reload has a session token but no private key: require a new passkey assertion.
 await page.reload();await mount();await page.getByRole('button',{name:'Sign in with passkey',exact:true}).click();try{await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();}catch(error){throw new Error(JSON.stringify({errors,text:await page.locator('body').innerText()}),{cause:error});}
 assert.equal(await page.evaluate(member=>JSON.parse(window.portfolio.portfolioSettings.getItem('tdsp-member-basis:'+member)).private,account.id),'account secret marker');
 // Link a second native PRF passkey and force login with only that credential available.
 await page.getByRole('button',{name:'Portfolio storage: Encrypted remote. Change storage',exact:true}).click();
 await cdp.send('WebAuthn.removeVirtualAuthenticator',{authenticatorId});
 const {authenticatorId:secondAuthenticator}=await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',ctap2Version:'ctap2_1',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,hasPrf:true,automaticPresenceSimulation:true}});
 await page.getByRole('button',{name:'Add another passkey',exact:true}).click();
 try{await page.getByText('Passkey linked to this storage location. Link it to your other storage location separately if you use both.',{exact:true}).waitFor();}catch(error){throw new Error(JSON.stringify({errors,text:await page.locator('body').innerText()}),{cause:error});}
 assert.equal((await store.read()).accounts[0].credentials.length,2);
 assert.equal((await vaultStore.open(account.id)).payload.version,2);
 await page.getByRole('button',{name:'Sign out of Portfolio',exact:true}).click();
 await page.getByRole('button',{name:'Sign in with passkey',exact:true}).click();
 await page.getByRole('button',{name:'Open Assets',exact:true}).waitFor();
 assert.equal(await page.evaluate(member=>JSON.parse(window.portfolio.portfolioSettings.getItem('tdsp-member-basis:'+member)).private,account.id),'account secret marker');
 // An authenticator without PRF never registers a misleading usable encryption key.
 await page.getByRole('button',{name:'Sign out of Portfolio',exact:true}).click();
 await cdp.send('WebAuthn.removeVirtualAuthenticator',{authenticatorId:secondAuthenticator});
 await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
 const beforeUnsupported=(await vaultStore.open(account.id)).payload;
 await page.getByRole('button',{name:'Create passkey & open Portfolio',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'This passkey cannot encrypt Portfolio data.'}).waitFor();
 assert.equal((await store.read()).accounts.length,1,'unsupported PRF never creates a persisted account');
 assert.deepEqual((await vaultStore.open(account.id)).payload,beforeUnsupported);
 assert.deepEqual(errors,[]);
 console.log('PASS: standalone passkey registration, native PRF enrollment, full Portfolio, encrypted checkpoints, logout, discoverable login, local/remote switching, reload, second passkey linking, unsupported PRF and responsive layout.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});}
