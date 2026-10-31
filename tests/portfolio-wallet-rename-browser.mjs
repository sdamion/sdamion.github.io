import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const extra='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {WalletCard} from './WalletAddresses';
import {memberWallets} from './member';
import {Table,TableBody} from './ui';
function Fixture(){
 const [wallets,setWallets]=useState(()=>memberWallets('${stake}',JSON.parse(localStorage.getItem('wallets')||JSON.stringify([{address:'${extra}',label:'Savings'}]))));
 window.savedWallets=wallets;
 return <main className="member-portfolio"><div className="history-table"><Table><TableBody>{wallets.map((wallet,index)=><WalletCard key={wallet.address} wallet={wallet} primary={index===0} snapshot={null} busy={true} excluded={new Set()} onExclude={()=>{}} remove={()=>{}} onRename={label=>{
  if(window.rejectRename)return false;
  const next=wallets.map(row=>row.address===wallet.address?{...row,label}:row);
  localStorage.setItem('wallets',JSON.stringify(next));setWallets(next);return true;
 }}/>)}</TableBody></Table></div></main>;
}
createRoot(document.getElementById('app')).render(<Fixture/>);
`},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 const mount=async()=>{
  await page.goto('http://127.0.0.1:8997/');
  await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  await page.getByRole('textbox',{name:'Wallet name',exact:true}).first().waitFor();
 };
 await mount();
 for(const [address,name] of [[stake,'My primary wallet'],[extra,'My savings address']]){
  const row=page.locator('tbody tr').filter({has:page.locator('a[title="'+address+'"]')});
  await row.getByRole('textbox',{name:'Wallet name',exact:true}).fill('  '+name+'  ');
  await row.getByRole('button',{name:'Save name',exact:true}).click();
  assert.equal(await row.getByRole('textbox',{name:'Wallet name',exact:true}).inputValue(),name);
  assert.equal(await row.getByRole('button',{name:'Save name',exact:true}).isDisabled(),true);
 }
 const primary=page.locator('tbody tr').first();
 await page.evaluate(()=>{window.rejectRename=true;});
 await primary.getByRole('textbox',{name:'Wallet name',exact:true}).fill('Unsaved name');
 await primary.getByRole('button',{name:'Save name',exact:true}).click();
 await primary.getByRole('alert').waitFor();
 assert.equal(await page.evaluate(()=>window.savedWallets[0].label),'My primary wallet');
 await mount();
 const saved=await page.evaluate(()=>window.savedWallets);
 assert.deepEqual(saved.map(row=>row.address),[stake,extra],'renaming never changes wallet ownership');
 assert.deepEqual(saved.map(row=>row.label),['My primary wallet','My savings address']);
 for(const width of [1200,390,320]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: inline primary/extra Cardano wallet labels, trimmed names, failed-save recovery, reload persistence, unchanged addresses and mobile widths during analysis.');
}finally{await browser.close();}
