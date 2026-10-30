import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const bundle=await build({stdin:{contents:`
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {MenuTile} from './ui';
import {WalletMenu} from './WalletMenu';
import {walletRefreshCounts} from './member';
import {activeAnalysedWalletGroups} from './wallet-discovery';
const addresses=Array.from({length:10},(_,i)=>'owned-'+i);
const groups={member:addresses,overlap:[addresses[0]]};
const facts=Object.fromEntries(Array.from({length:10},(_,i)=>['tx-'+i,{hash:'tx-'+i,wallets:addresses.slice(0,6)}]));
const snapshot={complete:true,groups,facts};
function Fixture(){
 const [open,setOpen]=useState(false),[excluded,setExcluded]=useState(false);
 const exclusions=new Set(excluded?[addresses[0]]:[]);
 const counts=walletRefreshCounts(groups,exclusions,activeAnalysedWalletGroups(snapshot,exclusions),'member');
 return <><MenuTile title="Wallets" value={counts.active+' / '+counts.total+' active'} onOpen={()=>setOpen(true)}/>
 <button onClick={()=>setExcluded(!excluded)}>Toggle exclusion</button>
 {open&&<WalletMenu counts={{wallets:counts.total,exchanges:0,byron:0,swap:0}} wallets={<p>Owned wallet addresses</p>} exchanges={null} byron={null}/>}</>;
}
createRoot(document.getElementById('app')).render(<Fixture/>);
`,resolveDir:path.resolve('delegators/portfolio-src'),loader:'tsx'},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<main class="member-portfolio" id="app"></main>'}));
 await page.goto('http://127.0.0.1:8997/');
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const tile=page.getByRole('button',{name:'Open Wallets',exact:true});
 await tile.waitFor();
 assert.match(await tile.innerText(),/7 \/ 11 active/);
 await tile.click();
 const own=page.getByRole('button',{name:'Open My Wallets',exact:true});
 await own.waitFor();
 assert.equal(await own.locator('.governance-card-title').innerText(),'11');
 await page.getByRole('button',{name:'Toggle exclusion',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Open Wallets"]').textContent.includes('6 / 11 active'));
 assert.equal(await own.locator('.governance-card-title').innerText(),'11');
 assert.deepEqual(errors,[]);
 console.log('PASS: primary stake counts once alongside linked wallets; exclusions affect activity but not the shared total.');
}finally{await browser.close();}
