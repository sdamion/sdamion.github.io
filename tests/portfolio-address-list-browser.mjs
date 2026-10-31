import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const items=[
 {network:'cardano',address:'stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',name:'Cardano Exchange',kind:'DEX / CEX'},
 {network:'ethereum',address:'0x'+'a'.repeat(40),name:'ETH Exchange',kind:'DEX'},
 {network:'solana',address:'So11111111111111111111111111111111111111112',name:'SOL Exchange',kind:'CEX'},
 {network:'bitcoin',address:'1BoatSLRHtKNngkdXEeobR76b53LETtpyT',name:'BTC Exchange',kind:'CEX'},
 {network:'ethereum',address:'0x'+'b'.repeat(40),name:'Swap Service',kind:'Swap',swapAddresses:['0x'+'c'.repeat(40)]}
];
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';import {useState} from 'react';import {AddressList} from './AddressList';import {WalletCard} from './WalletAddresses';
function Fixture(){
 const [items,setItems]=useState(()=>JSON.parse(localStorage.getItem('items')||'${JSON.stringify(items)}'));
 const [owned,setOwned]=useState(false),[viewing,setViewing]=useState(null),[excluded,setExcluded]=useState(new Set());window.saved=items;
 function save(next){if(window.failSave)return false;localStorage.setItem('items',JSON.stringify(next));setItems(next);return true;}
 const rows=items.map((item,index)=>({...item,id:item.network+':'+item.address,linked:item.swapAddresses,removeDisabled:owned&&index===0,
 ...(owned?{onView:()=>{window.viewed=item.address;setViewing(item);}}:item.kind==='Swap'?{}:{onMining:miner=>save(items.map(row=>row.address===item.address?{...row,miner}:row))}),
 onRename:name=>save(items.map(row=>row.address===item.address?{...row,name}:row)),onRemove:()=>save(items.filter(row=>row.address!==item.address))}));
 const linked='addr1testinglinked',snapshot={groups:{[items[0].address]:[linked]},infos:[{address:linked,balance:'1000000'}],facts:Object.fromEntries(Array.from({length:10},(_,index)=>['tx'+index,{hash:'tx'+index,wallets:[linked]}]))};
 return <main className="member-portfolio"><button onClick={()=>setOwned(value=>!value)}>Toggle owned</button><AddressList owned={owned} rows={rows}/>{viewing&&<WalletCard detailsOnly wallet={{address:viewing.address,label:viewing.name}} primary snapshot={snapshot} busy={false} excluded={excluded} remove={()=>{}} onExclude={(address,value)=>setExcluded(value?new Set([address]):new Set())} onClose={()=>setViewing(null)}/>}</main>;
}createRoot(document.getElementById('app')).render(<Fixture/>);
`},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 const mount=async()=>{
  await page.goto('http://127.0.0.1:8997/');await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.addScriptTag({content:await readFile('shared/runtime.js','utf8')});
  await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};});
  await page.evaluate(()=>{document.addEventListener('keydown',event=>{if(event.key==='Escape')window.overlayEscapes=(window.overlayEscapes||0)+1;});});
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{if(window.failCopy)throw Error('Denied');window.copied=value;}}}));
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});await page.locator('tbody tr').first().waitFor();
 };
 await mount();assert.equal(await page.locator('table').count(),1);
 assert.deepEqual(await page.locator('thead th').allTextContents(),['Network','Exchange','Address','Mining / Services Sources','Actions']);
 assert.equal(await page.getByRole('checkbox').count(),4,'Swap rows are not mining counterparties');
 for(const item of items){
  const row=page.locator('tr[data-address-id="'+item.network+':'+item.address+'"]');
  const link=row.locator('a[title="'+item.address+'"]');await link.waitFor();
  assert.match(await link.getAttribute('href'),/^https:\/\/(cardanoscan\.io|etherscan\.io|solscan\.io|blockstream\.info)\//);
  assert.equal(await link.getAttribute('target'),'_blank');
  await row.getByRole('button',{name:'Copy address',exact:true}).first().click();assert.equal(await page.evaluate(()=>window.copied),item.address);
 }
 const first=page.locator('tbody tr').first();
 await first.getByRole('button',{name:'Actions for Cardano Exchange',exact:true}).click();
 await page.getByRole('menuitem',{name:'Rename',exact:true}).waitFor();await page.keyboard.press('ArrowDown');
 assert.equal(await page.getByRole('menuitem',{name:'Remove',exact:true}).evaluate(node=>node===document.activeElement),true);
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('menu').count(),0);assert.equal(await page.evaluate(()=>window.overlayEscapes||0),0,'Escape closes only the menu, not its parent overlay');
 await first.getByRole('button',{name:'Actions for Cardano Exchange',exact:true}).click();await page.getByRole('menuitem',{name:'Rename',exact:true}).click();
 const name=first.getByRole('textbox',{name:'Exchange name',exact:true});await name.fill('Updated name');
 await page.evaluate(()=>{window.failSave=true;});await first.getByRole('button',{name:'Save name',exact:true}).click();await page.getByRole('alert').waitFor();
 assert.equal(await page.evaluate(()=>window.saved[0].name),'Cardano Exchange');
 await page.evaluate(()=>{window.failSave=false;});await first.getByRole('button',{name:'Save name',exact:true}).click();assert.equal(await name.count(),0);
 await first.getByRole('checkbox').check();assert.equal(await page.evaluate(()=>window.saved[0].miner),true);
 await page.evaluate(()=>{window.failCopy=true;});await first.getByRole('button',{name:'Copy address',exact:true}).click();await page.getByRole('alert').filter({hasText:'Could not copy address.'}).waitFor();
 await mount();assert.match(await first.innerText(),/Updated name/);assert.equal(await first.getByRole('checkbox').isChecked(),true);
 await page.getByText('Linked addresses',{exact:false}).click();
 await page.locator('details').getByRole('button',{name:'Copy address',exact:true}).click();assert.equal(await page.evaluate(()=>window.copied),'0x'+'c'.repeat(40));
 for(const width of [1200,390,320]){
  await page.setViewportSize({width,height:900});const trigger=page.getByRole('button',{name:'Actions for BTC Exchange',exact:true});await trigger.click();
  const bounds=await page.getByRole('menu').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1&&bounds.y>=0&&bounds.y+bounds.height<=900,JSON.stringify({width,bounds}));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'/tmp/portfolio-address-list-'+width+'.png'});await page.keyboard.press('Escape');
 }
 await page.getByRole('button',{name:'Toggle owned',exact:true}).click();await first.getByRole('button',{name:'Actions for Updated name',exact:true}).click();
 assert.equal(await page.getByRole('menuitem',{name:'Remove',exact:true}).isDisabled(),true,'primary wallet removal stays disabled');
 await page.getByRole('menuitem',{name:'View',exact:true}).click();assert.equal(await page.evaluate(()=>window.viewed),items[0].address);
 const details=page.locator('#portfolio-wallet-addresses');await details.getByRole('checkbox',{name:'Exclude addr1testinglinked from refresh',exact:true}).check();
 assert.equal(await details.getByRole('checkbox',{name:'Exclude addr1testinglinked from refresh',exact:true}).isChecked(),true,'View retains linked-address exclusions');
 await details.getByRole('button',{name:'Back',exact:true}).click();
 assert.equal(await page.getByRole('checkbox').count(),0,'owned wallets are not counterparty mining sources');
 await page.getByRole('button',{name:'Toggle owned',exact:true}).click();
 await page.getByRole('button',{name:'Actions for BTC Exchange',exact:true}).click();await page.getByRole('menuitem',{name:'Remove',exact:true}).click();assert.equal(await page.locator('tbody tr').count(),4);
 assert.deepEqual(errors,[]);
 console.log('PASS: one cross-network table, explorer links, exact-address clipboard copy, linked-address copy, menu keyboard/viewport behavior, persistent rename/source flags, failed saves/copy and protected own-wallet actions.');
}finally{await browser.close();}
