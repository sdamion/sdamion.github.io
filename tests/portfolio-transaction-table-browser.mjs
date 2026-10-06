import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {PortfolioCurrencyContext} from './portfolio-currency';
import {TransactionTable,TransactionRow,TransactionAmount,TransactionWallets} from './TransactionTable';
import {GainLossTransaction} from './GainLossTransaction';
import {AddressTransactions} from './ByronExchanges';
const time=1700000000;
const base={hash:'in',time,adaRaw:'100000000',feeRaw:'0',internal:false,wallets:['owned'],assets:{},decimals:{},swapCandidate:false};
const incoming={...base,externalInputs:[{address:'exchange',lovelace:'100000000'}]};
const outgoing={...base,hash:'out',adaRaw:'-100000000',externalOutputs:[{address:'exchange',lovelace:'100000000'}]};
function ByronFixture(){
 const [currency,setCurrency]=useState('USD');window.setByronCurrency=setCurrency;
 const [rates,setRates]=useState({'2023-11-14':{EUR:0.9,JPY:150}});window.setByronRates=setRates;
 return <PortfolioCurrencyContext.Provider value={{currency,rate:currency==='EUR'?0.8:currency==='JPY'?145:1,adaUsd:0.5,locale:'en',fxHistory:rates}}><AddressTransactions facts={[incoming,outgoing].map(fact=>({...fact,feeRaw:'400000'}))} address="exchange" entries={[{address:'exchange',name:'Bitvavo'}]} count={2} wallets={[{address:'owned',label:'Savings'}]} history={{[new Date(time*1000).toISOString().slice(0,10)]:0.25}}/></PortfolioCurrencyContext.Provider>;
}
createRoot(document.getElementById('app')).render(<><TransactionTable>
 <TransactionRow hash="normal" time={time} amount={<TransactionAmount ada={-100} usd={-25}/>} price={0.25} feeRaw="0" wallets={<TransactionWallets labels={['Savings','DEX contract: CSwap','DEX contract: Minswap V1']} exchanges={[]}/>}/>
 <TransactionRow hash="unknown" time={time} amount="Unavailable" wallets="Unknown"/>
 {[incoming,outgoing].map(fact=><GainLossTransaction key={fact.hash} tx={{tx_hash:fact.hash,block_time:time,block_height:1}} fact={fact} entries={[{address:'exchange',name:'Bitvavo'}]} wallets={[{address:'owned',label:'Savings'}]} history={{[new Date(time*1000).toISOString().slice(0,10)]:0.25}}/>)}
</TransactionTable><ByronFixture/></>);
`,loader:'tsx',resolveDir:path.resolve('delegators/portfolio-src')},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/components/ui/table':path.resolve('delegators/portfolio-src/ui.tsx'),'@/components/ui/input':path.resolve('delegators/portfolio-src/ui.tsx'),'@/components/ui/pagination':path.resolve('delegators/portfolio-src/ui.tsx')}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.setContent('<div id="app" class="member-portfolio"></div>');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
 await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('div');overlay.id=options.id;overlay.append(...options.bodyNodes);document.body.append(overlay);return {overlay};};});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 await page.getByText('ADA OUT',{exact:true}).waitFor();
 assert.deepEqual(await page.locator('th').allTextContents(),['ADA Amount','USD/ADA Price','Fee','Wallets','Date']);
 const rows=page.locator('tbody tr');
 assert.equal(await rows.count(),4);
 for(let i=0;i<4;i++)assert.equal(await rows.nth(i).locator('td').count(),5);
 assert.match(await rows.nth(0).locator('td').nth(2).innerText(),/0/,'zero fees are not unavailable');
 assert.equal(await rows.nth(1).locator('td').nth(2).innerText(),'Unavailable');
 assert.match(await rows.nth(2).locator('td').nth(3).innerText(),/Bitvavo[\s\S]*Savings/);
 assert.equal(await rows.nth(2).locator('td').first().locator('strong.negative').count(),1);
 assert.equal(await rows.nth(3).locator('td').first().locator('strong.positive').count(),1);
 assert.equal(await page.locator('a[href="https://cardanoscan.io/transaction/normal"]').count(),1);
 assert.equal(await page.locator('.portfolio-transfer-row--dex').count(),0);
 assert.equal(await page.locator('.portfolio-dex-label').count(),2);
 for(const [theme,color] of [['light','rgb(166, 66, 0)'],['dark','rgb(251, 146, 60)']]){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   for(const label of await page.locator('.portfolio-dex-label').all())assert.equal(await label.evaluate(el=>getComputedStyle(el).color),color);
   for(const index of [0,2,3]){
     const row=rows.nth(index);
     const ada=row.locator('.pool-delegator-amount > span').first();
     const usd=row.locator('.pool-delegator-usd');
     assert.notEqual(await ada.evaluate(el=>getComputedStyle(el).color),await usd.evaluate(el=>getComputedStyle(el).color),'only ADA amount has the transfer tone');
     assert.equal(await usd.evaluate(el=>getComputedStyle(el).color),await row.locator('td').nth(4).evaluate(el=>getComputedStyle(el).color),'USD uses default detail color');
   }
   for(const index of [2,3]){
     const label=rows.nth(index).getByText(index===2?'ADA IN':'ADA OUT',{exact:true});
     assert.equal(await label.evaluate(el=>getComputedStyle(el).color),await rows.nth(index).locator('td').nth(4).evaluate(el=>getComputedStyle(el).color),'IN/OUT labels use default color');
   }
   assert.notEqual(await rows.nth(0).locator('strong').evaluate(el=>getComputedStyle(el).color),color);
   assert.notEqual(await rows.nth(0).locator('a').evaluate(el=>getComputedStyle(el).color),color);
   assert.notEqual(await rows.nth(0).getByText('Savings',{exact:true}).evaluate(el=>getComputedStyle(el).color),color);
 }
 await page.getByRole('button',{name:'View',exact:true}).click();
 const byron=page.locator('#portfolio-byron-amounts-overlay');
 await byron.locator('tbody tr').first().waitFor();
 assert.deepEqual(await byron.locator('th').allTextContents(),['USD Amount','USD/ADA Price','Fee','Wallets','Date']);
 assert.equal(await byron.locator('tbody tr').count(),2);
 assert.match(await byron.locator('tbody tr').first().locator('td').nth(3).innerText(),/Bitvavo[\s\S]*Savings/);
 const walletChange=byron.getByText(/Wallet change \(after fees\):/).first();
 assert.match(await walletChange.innerText(),/\$25\.00/,'wallet change uses the transaction-day ADA price, not the current quote');
 await page.evaluate(()=>window.setByronCurrency('EUR'));
 await page.waitForFunction(()=>document.querySelector('#portfolio-byron-amounts-overlay')?.textContent.includes('€22.50'));
 assert.match(await walletChange.innerText(),/€22\.50/,'historical FX overrides the current quote');
 assert.equal(await byron.locator('tbody tr').first().locator('td').nth(2).innerText(),'€0.09','fees use the same transfer-day ADA and FX rates');
 await page.evaluate(()=>window.setByronCurrency('JPY'));
 await page.waitForFunction(()=>document.querySelector('#portfolio-byron-amounts-overlay')?.textContent.includes('¥3,750'));
 assert.match(await walletChange.innerText(),/¥3,750/);
 await page.evaluate(()=>{window.setByronRates({});window.setByronCurrency('EUR');});
 await page.waitForFunction(()=>document.querySelector('#portfolio-byron-amounts-overlay tbody tr td strong')?.textContent==='—');
 assert.equal(await byron.locator('tbody tr').first().locator('td').nth(2).innerText(),'—','missing historical FX never falls back to a current rate');
 await page.evaluate(()=>window.setByronCurrency('ADA'));
 await page.waitForFunction(()=>document.querySelector('#portfolio-byron-amounts-overlay')?.textContent.includes('₳ 100'));
 assert.match(await walletChange.innerText(),/₳ 100/);
 for(const width of [768,320,390]){
   await page.setViewportSize({width,height:844});
   const shell=page.locator('#app .table-shell').first();
   if(width<768){
     assert.ok(await shell.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'all fields fit without horizontal scrolling');
     assert.ok(await shell.locator('td').first().evaluate(el=>el.getBoundingClientRect().width>=280));
     assert.deepEqual(await shell.locator('tbody tr').first().locator('td').evaluateAll(cells=>cells.map(cell=>cell.dataset.label)),['ADA Amount','USD/ADA Price','Fee','Wallets','Date']);
     assert.equal(await shell.locator('td').first().evaluate(el=>getComputedStyle(el).display),'block');
     const amountStyle=async index=>rows.nth(index).locator('.portfolio-transfer-amount').evaluate(el=>{const s=getComputedStyle(el);return {font:s.fontSize,weight:s.fontWeight,display:s.display};});
     assert.deepEqual(await amountStyle(0),await amountStyle(2),'Transactions and gain/loss share amount typography');
     assert.equal(await rows.nth(0).locator('.pool-delegator-amount').count(),1);
     assert.equal(await rows.nth(2).locator('.pool-delegator-amount').count(),1);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-wide overflow');
 }
 await page.screenshot({path:'/tmp/portfolio-mobile-table.png',fullPage:true});
 console.log('PASS: shared transaction columns, row alignment, wallet names, missing/zero fees, CEX colors and transaction links.');
}finally{await browser.close();}
