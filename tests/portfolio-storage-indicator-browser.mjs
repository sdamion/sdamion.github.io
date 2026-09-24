import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const stake='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
// Exercise the real entry/chooser UI; wallet cryptography is covered by vault tests.
const bundle=await build({entryPoints:[path.resolve('delegators/portfolio-src/entry.tsx')],bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'test-services',setup(build){
  build.onLoad({filter:/\/vault\.ts$/},()=>({loader:'ts',contents:`
    let mode=null;
    export const savedStorage=()=>localStorage.getItem('storage');
    export const preferredStorage=()=>savedStorage()||'local';
    export const storageMode=()=>mode;
    export const isPortfolioMobile=()=>false;
    export const vaultUnlocked=()=>mode!==null;
    export const flushVault=async()=>{};
    export const unlockPortfolio=async()=>{};
    export const deleteStoredCache=async()=>{mode=null;};
    export async function switchStorage(next,stake,wallet){if(next==='remote'&&!wallet)throw new Error('Reconnect your wallet in the members area to enable encrypted remote storage.');window.approvals=(window.approvals||0)+1;if(next==='remote')await new Promise((resolve,reject)=>window.approve=ok=>ok?resolve():reject(new Error('Wallet approval declined')));mode=next;localStorage.setItem('storage',next);}
  `}));
  build.onLoad({filter:/\/transport\.ts$/},()=>({loader:'ts',contents:`export const setSessionRole=()=>{};export const portfolioFetch=async()=>({ok:true,json:async()=>({stake_address:'${stake}'})});`}));
  build.onLoad({filter:/\/App\.tsx$/},()=>({loader:'tsx',contents:'export default function Home(){return <div>Portfolio contents</div>;}'}));
  build.onLoad({filter:/\/CacheUploadProgress\.tsx$/},()=>({loader:'tsx',contents:'export function CacheUploadProgress(){return null;}'}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="root"></div>'}));
  await page.goto('http://127.0.0.1:8998/');
  async function mount(){
    await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
    await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('div');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};});
    await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text+'\nlet connected=!localStorage.getItem("storage");window.detach=mountPortfolio(document.getElementById("root"),{getWallet:async(reconnect)=>{if(reconnect){connected=true;window.reconnects=(window.reconnects||0)+1;}return connected?{signData:async()=>({signature:"",key:""})}:null;}});'});
  }
  await mount();
  await page.getByRole('heading',{name:'Portfolio storage',exact:true}).waitFor();
  await page.getByRole('radio',{name:'Encrypted remote cache',exact:true}).check();
  await page.getByRole('button',{name:'Open Portfolio',exact:true}).click();
  await page.waitForFunction(()=>typeof window.approve==='function');
  await page.evaluate(()=>window.approve(true));
  await page.getByText('Portfolio contents',{exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Portfolio storage'}).count(),0);
  await page.getByRole('button',{name:'Portfolio storage: Encrypted remote. Change storage',exact:true}).waitFor();
  await page.reload();await mount();
  await page.getByText('Reconnect your wallet in the members area to enable encrypted remote storage.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Unlock Portfolio',exact:true}).click();
  await page.waitForFunction(()=>typeof window.approve==='function');
  assert.equal(await page.evaluate(()=>window.reconnects),1);
  assert.equal(await page.getByRole('heading',{name:'Portfolio storage'}).count(),0);
  await page.evaluate(()=>window.approve(false));
  await page.getByText('Wallet approval declined',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Unlock Portfolio',exact:true}).click();
  await page.waitForFunction(()=>window.approvals===2);
  await page.evaluate(()=>window.approve(true));
  await page.getByText('Portfolio contents',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Portfolio storage: Encrypted remote. Change storage',exact:true}).click();
  await page.getByRole('radio',{name:'Local browser · desktop only',exact:true}).check();
  await page.getByRole('button',{name:'Apply storage choice',exact:true}).click();
  await page.getByRole('button',{name:'Portfolio storage: Local browser. Change storage',exact:true}).waitFor();
  await page.reload();await mount();
  await page.getByText('Portfolio contents',{exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Portfolio storage'}).count(),0);
  console.log('PASS: first choice, remembered remote approval, declined/retry, mode indicator, switch and local resume.');
}finally{await browser.close();}
