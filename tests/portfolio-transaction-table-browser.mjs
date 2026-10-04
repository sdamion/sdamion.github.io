import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`
import {createRoot} from 'react-dom/client';
import {TransactionTable,TransactionRow} from './TransactionTable';
import {GainLossTransaction} from './GainLossTransaction';
import {AddressTransactions} from './ByronExchanges';
const time=1700000000;
const base={hash:'in',time,adaRaw:'100000000',feeRaw:'0',internal:false,wallets:['owned'],assets:{},decimals:{},swapCandidate:false};
const incoming={...base,externalInputs:[{address:'exchange',lovelace:'100000000'}]};
const outgoing={...base,hash:'out',adaRaw:'-100000000',externalOutputs:[{address:'exchange',lovelace:'100000000'}]};
createRoot(document.getElementById('app')).render(<><TransactionTable>
 <TransactionRow hash="normal" time={time} amount="100 ADA" price={0.25} feeRaw="0" wallets="Savings"/>
 <TransactionRow hash="unknown" time={time} amount="Unavailable" wallets="Unknown"/>
 {[incoming,outgoing].map(fact=><GainLossTransaction key={fact.hash} tx={{tx_hash:fact.hash,block_time:time,block_height:1}} fact={fact} entries={[{address:'exchange',name:'Bitvavo'}]} wallets={[{address:'owned',label:'Savings'}]} history={{[new Date(time*1000).toISOString().slice(0,10)]:0.25}}/>)}
</TransactionTable><AddressTransactions facts={[incoming,outgoing]} address="exchange" entries={[{address:'exchange',name:'Bitvavo'}]} count={2} wallets={[{address:'owned',label:'Savings'}]} history={{[new Date(time*1000).toISOString().slice(0,10)]:0.25}}/></>);
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
 await page.getByRole('button',{name:'View',exact:true}).click();
 const byron=page.locator('#portfolio-byron-amounts-overlay');
 await byron.locator('tbody tr').first().waitFor();
 assert.deepEqual(await byron.locator('th').allTextContents(),['ADA Amount','USD/ADA Price','Fee','Wallets','Date']);
 assert.equal(await byron.locator('tbody tr').count(),2);
 assert.match(await byron.locator('tbody tr').first().locator('td').nth(3).innerText(),/Bitvavo[\s\S]*Savings/);
 console.log('PASS: shared transaction columns, row alignment, wallet names, missing/zero fees, CEX colors and transaction links.');
}finally{await browser.close();}
