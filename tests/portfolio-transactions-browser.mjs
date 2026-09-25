import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src');
const require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const bundle=await build({stdin:{contents:`
  import {createRoot} from 'react-dom/client';
  import {useState} from 'react';
  import {Transaction} from './App';
  import {AssetOverlay} from './AssetOverlay';
  import {TransactionFilters} from './TransactionFilters';
  const facts=[{hash:'receive',adaRaw:'1000000',assets:{}},{hash:'mixed',adaRaw:'1000000',assets:{token:'-1'}},{hash:'other',adaRaw:'0',assets:{}}];
  function Test(){const [open,setOpen]=useState(false);return <><button onClick={()=>setOpen(true)}>Transactions</button>{open&&<AssetOverlay id="portfolio-transactions-overlay" name="Transactions" onClose={()=>setOpen(false)}><TransactionFilters id="test" query="" onQuery={()=>{}} filter="all" onFilter={()=>{}} dateFrom="" dateTo="" onDates={()=>{}}/><table><tbody>{facts.map(f=><Transaction key={f.hash} tx={{tx_hash:f.hash,block_time:1700000000,block_height:1}} fact={{...f,time:1700000000,decimals:{},feeRaw:'0',internal:false,wallets:[],swapCandidate:false}} markets={{}} wallets={[]} history={{}} cexAddresses={[]} swapAddresses={new Set()}/>)}</tbody></table></AssetOverlay>}</>;}
  createRoot(document.getElementById('app')).render(<Test/>);
`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'export-row-for-test',setup(build){build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:await readFile(args.path,'utf8')+'\nexport {Transaction};'}));}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
  await page.goto('http://127.0.0.1:8998/');
  await page.evaluate(()=>{window.createUniversalOverlay=options=>{
    const overlay=document.createElement('section');overlay.id=options.id;
    const title=document.createElement('h2');title.textContent=options.titleText;
    const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;
    overlay.append(title,back,...options.bodyNodes);document.body.append(overlay);return {overlay};
  };});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  for(let i=0;i<2;i++){
    await page.getByRole('button',{name:'Transactions',exact:true}).click();
    await page.locator('#portfolio-transactions-overlay tbody tr').first().waitFor();
    assert.equal(await page.locator('#portfolio-transactions-overlay tbody tr').count(),3);
    for(const label of ['Receives','Mixed','Other'])assert.ok((await page.locator('#portfolio-transactions-overlay tbody').innerText()).includes(label));
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.locator('#portfolio-transactions-overlay').waitFor({state:'detached'});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: Transactions opens and reopens with receive, mixed and other rows without rendering errors.');
}finally{await browser.close();}
