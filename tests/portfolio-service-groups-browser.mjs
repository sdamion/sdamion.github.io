import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const source=path.resolve('delegators/portfolio-src');
const bundle=await build({stdin:{contents:`
 import {createRoot} from 'react-dom/client';
 import {useState} from 'react';
 import {CexAddresses} from './CexAddresses';
 function Test(){
  const [entries,setEntries]=useState([{address:'addr1exchange1',name:'Bitvavo'},{address:'addr1exchange2',name:' bitvavo '},{address:'addr1single',name:'Other'}]);
  const [wallets,setWallets]=useState([{address:'addr1swap1',label:'My Swap',group:'swap'},{address:'addr1swap2',label:'My Swap',group:'swap'}]);
  window.entries=entries;window.wallets=wallets;
  return <main className="member-portfolio"><CexAddresses entries={entries} owned={[]} onChange={next=>{setEntries(next);return true;}} swap={{wallets,onChange:setWallets}}/></main>;
 }
 createRoot(document.getElementById('app')).render(<Test/>);
`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/components/ui/table':path.join(source,'ui.tsx')}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:800}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 await page.goto('http://127.0.0.1:8998/');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const exchange=page.getByRole('button',{name:'Bitvavo',exact:true});
 await exchange.waitFor();
 assert.equal(await exchange.getAttribute('aria-expanded'),'false');
 assert.equal(await exchange.locator('xpath=ancestor::tr').locator('td').nth(1).innerText(),'2');
 assert.equal(await page.getByRole('link').filter({hasText:'addr1exchange'}).count(),0);
 assert.equal(await page.locator('a[href$="addr1single"]').count(),1,'singleton remains visible');
 await exchange.click();
 assert.equal(await page.locator('a[href$="addr1exchange1"],a[href$="addr1exchange2"]').count(),2);
 await page.getByRole('button',{name:'Remove Bitvavo address',exact:true}).click();
 assert.equal(await exchange.count(),0,'one remaining address is no longer grouped');
 assert.equal(await page.locator('a[href$="addr1exchange2"]').count(),1);
 const swap=page.getByRole('button',{name:'My Swap',exact:true});
 assert.equal(await swap.getAttribute('aria-expanded'),'false');
 await swap.focus();await page.keyboard.press('Enter');
 assert.equal(await page.getByRole('textbox',{name:'Swap name',exact:true}).count(),2);
 await page.getByRole('textbox',{name:'Swap name',exact:true}).first().fill('Renamed Swap');
 await page.getByRole('button',{name:'Save Swap name',exact:true}).first().click();
 assert.equal(await swap.count(),0,'renaming moves the wallet out of the group');
 assert.equal(await page.getByRole('textbox',{name:'Swap name',exact:true}).first().inputValue(),'Renamed Swap');
 await page.getByRole('button',{name:'Remove addr1swap1 from Swap',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.wallets.length),1);
 const contractGroups=page.locator('table').last().getByRole('button',{expanded:false});
 assert.ok(await contractGroups.count()>0,'known DEX names share the same grouping');
 await contractGroups.first().click();
 assert.ok(await page.locator('table').last().getByRole('link').count()>0);
 for(const width of [1100,390,320]){
  await page.setViewportSize({width,height:800});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'grouped tables fit the viewport');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: shared exchange/Swap/contract name groups, keyboard toggle, rename, remove and mobile widths.');
}finally{await browser.close();}
