import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src');
const require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{base58}=require('@scure/base');
const {chromium}=await import(process.argv[2]||'playwright');
const eth='0x'+'2'.repeat(40),ownEth='0x'+'1'.repeat(40);
const sol=base58.encode(new Uint8Array(32).fill(2)),ownSol=base58.encode(new Uint8Array(32).fill(1));
const bundle=await build({stdin:{contents:`
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {EthereumWallets} from './EthereumWallets';
import {SolanaWallets} from './SolanaWallets';
import {ethereumWallets,emptyEthereum} from './ethereum';
import {nativeWallets,emptySolana} from './solana';
function Fixture(){
 const [eth,setEth]=useState(()=>ethereumWallets(JSON.parse(localStorage.getItem('eth')||'[]')));
 const [sol,setSol]=useState(()=>nativeWallets(JSON.parse(localStorage.getItem('sol')||'[]')));
 return <main className="member-portfolio"><EthereumWallets exchanges wallets={eth} data={emptyEthereum()} owned={[{address:'${ownEth}',name:'Owned'}]} onChange={next=>{localStorage.setItem('eth',JSON.stringify(next));setEth(next);return true;}}/>
 <SolanaWallets exchanges wallets={sol} data={emptySolana()} owned={[{address:'${ownSol}',name:'Owned'}]} onChange={next=>{localStorage.setItem('sol',JSON.stringify(next));setSol(next);return true;}}/></main>;
}
createRoot(document.getElementById('app')).render(<Fixture/>);
`,resolveDir:source,loader:'tsx'},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 const mount=async()=>{await page.goto('http://127.0.0.1:8997/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});};
 await mount();
 for(const [prefix,address,own,name] of [['portfolio-eth-cex',eth,ownEth,'ETH DEX'],['portfolio-sol-cex',sol,ownSol,'SOL DEX']]){
   const form=page.locator('form').filter({has:page.locator('#'+prefix+'-address')});
   await form.locator('select').selectOption('dex');
   await form.locator('[name="address_name"]').fill(name);
   await form.locator('[name="service_address"]').fill('invalid-address');
   await form.getByRole('button',{name:'Add',exact:true}).click();
   assert.equal(await page.locator('tbody tr').count(),prefix.includes('eth')?0:1,'invalid DEX addresses are not saved');
   await form.locator('[name="service_address"]').fill(own);
   await form.getByRole('button',{name:'Add',exact:true}).click();
   assert.equal(await page.locator('tbody tr').count(),prefix.includes('eth')?0:1,'owned wallets cannot become DEX counterparties');
   await form.locator('[name="service_address"]').fill(address);
   await form.getByRole('button',{name:'Add',exact:true}).click();
   const row=page.locator('tbody tr').filter({has:page.locator('a[title="'+address+'"]')});
   await row.waitFor();assert.match(await row.innerText(),/DEX/);
 }
 await mount();
 await page.getByRole('heading',{name:'Ethereum DEX / CEX addresses',exact:true}).waitFor();
 for(const [key,address] of [['eth',eth],['sol',sol]]){
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
   assert.equal(saved[0].dex,true);assert.equal(saved[0].address,address);
   assert.equal(await page.locator('tbody tr').filter({has:page.locator('a[title="'+address+'"]')}).count(),1);
 }
 for(const width of [1200,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 assert.deepEqual(errors,[]);
 console.log('PASS: ETH/SOL DEX forms, validation, own-wallet exclusion, persistence, base58 case and responsive layout.');
}finally{await browser.close();}
