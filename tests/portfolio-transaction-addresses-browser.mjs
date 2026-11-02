import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';
import {BitcoinTransaction} from './BitcoinTransaction';
import {EthereumTransaction} from './EthereumTransaction';
import {SolanaTransaction} from './SolanaTransaction';
import {TransactionWallets} from './TransactionTable';
const btc='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',other='1BitcoinEaterAddressDontSendf59kuE',eth='0x'+'1'.repeat(40),target='0x'+'2'.repeat(40),sol='A'.repeat(44),recipient='B'.repeat(44),payer='C'.repeat(44),ada='addr1'+'x'.repeat(95),receiver='addr1'+'y'.repeat(95);
const common={history:{},adaHistory:{}};
createRoot(document.getElementById('app')).render(<table><tbody>
<BitcoinTransaction {...common} tx={{hash:'1'.repeat(64),height:1,time:1700000000,feeRaw:'1000',inputs:[{address:btc,raw:'10000'},{address:other,raw:'10000'},{address:btc,raw:'2000'}],outputs:[{address:other,raw:'20000'},{address:btc,raw:'1000'}]}} wallets={[{address:btc,name:'BTC Wallet'}]} exchanges={[]}/>
<EthereumTransaction {...common} tx={{id:'eth',hash:'0x'+'3'.repeat(64),kind:'normal',from:eth,to:eth,time:1700000000,valueWei:'10000',feeWei:'1000',failed:false}} wallets={[{address:eth,name:'ETH Wallet'}]} exchanges={[]}/>
<SolanaTransaction {...common} tx={{hash:'4'.repeat(88),slot:1,time:1700000000,feeRaw:'5000',payer,failed:false,transfers:[{from:sol,to:recipient,raw:'1000'},{from:sol,to:recipient,raw:'2000'},{from:payer,to:'D'.repeat(44),raw:'9999'}]}} wallets={[{address:sol,name:'SOL Wallet'}]} exchanges={[{address:recipient,name:'SOL Exchange',out:true}]}/>
<tr><td><TransactionWallets labels={['ADA Wallet']} wallets={[{address:ada,label:'ADA Wallet'}]} exchanges={[]} fact={{source:{inputs:[{payment_addr:{bech32:ada},value:'1000'}],outputs:[{payment_addr:{bech32:receiver},value:'900'},{payment_addr:{bech32:ada},value:'50'}]}}}/></td></tr>
</tbody></table>);
`},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
 await page.goto('http://127.0.0.1:8997/');
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{if(window.failCopy)throw new Error('Clipboard denied');window.copied=value;}}});});
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 await page.getByText('SOL Wallet',{exact:false}).first().waitFor();
 const rows=page.locator('tbody > tr');assert.equal(await rows.count(),4);
 const btc=rows.nth(0).locator('td').nth(3),eth=rows.nth(1).locator('td').nth(3),sol=rows.nth(2).locator('td').nth(3),ada=rows.nth(3);
 assert.equal(await btc.locator('a').count(),2,'only owned inputs and external recipients appear for OUT');
 assert.match(await btc.innerText(),/From:\s*BTC Wallet[\s\S]*To:/);
 assert.doesNotMatch(await btc.innerText(),/To:\s*BTC Wallet/);
 assert.equal(await eth.locator('a').count(),2,'self-transfers preserve both From and To');
 assert.match(await eth.innerText(),/From:\s*ETH Wallet[\s\S]*To:\s*ETH Wallet/);
 assert.match(await sol.innerText(),/From:\s*SOL Wallet[\s\S]*To:\s*SOL Exchange[\s\S]*OUT address/);
 assert.equal(await sol.locator('a').count(),2,'only transfer senders and recipients appear, not the separate fee payer');
 assert.equal(await sol.locator('a[title="'+ 'C'.repeat(44)+'"]').count(),0);
 assert.doesNotMatch(await page.locator('#app').innerText(),/Fee payer/);
 assert.match(await ada.innerText(),/From:\s*ADA Wallet[\s\S]*To:/);
 assert.doesNotMatch(await ada.innerText(),/To:\s*ADA Wallet/);
 assert.match(await rows.nth(2).locator('td').nth(2).innerText(),/0 SOL/,'third-party-paid SOL fees are not wallet fees');
 assert.doesNotMatch(await sol.innerText(),/DDDD/,'unrelated Solana transfers stay hidden');
 for(const [cell,prefix]of [[btc,'https://blockstream.info/address/'],[eth,'https://etherscan.io/address/'],[sol,'https://solscan.io/account/'],[ada,'https://cardanoscan.io/address/']])for(const link of await cell.locator('a').all()){
  assert.ok((await link.getAttribute('href')).startsWith(prefix));assert.ok(await link.getAttribute('title'));assert.equal(await link.getAttribute('rel'),'noreferrer');
 }
 for(const [cell,name]of [[btc,'BTC Wallet'],[eth,'ETH Wallet'],[sol,'SOL Wallet'],[ada,'ADA Wallet']]){
  const link=cell.getByRole('link',{name,exact:true}).first();assert.equal(await link.innerText(),name,'named wallet hides the address text');
  const address=await link.getAttribute('title');assert.ok(address);
  await link.locator('..').getByRole('button',{name:'Copy address',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.copied),address,'copy always uses the full blockchain address, never the name');
 }
 const unnamed=btc.locator('a').last();assert.notEqual(await unnamed.innerText(),'');assert.notEqual(await unnamed.innerText(),await unnamed.getAttribute('title'),'unnamed addresses remain shortened');
 const copy=btc.getByRole('button',{name:'Copy address',exact:true}).first();
 for(const hovered of [false,true]){
  if(hovered)await copy.hover();
  const style=await copy.evaluate(button=>{const css=getComputedStyle(button);return {border:css.borderTopWidth,background:css.backgroundColor,shadow:css.boxShadow};});
  assert.deepEqual(style,{border:'0px',background:'rgba(0, 0, 0, 0)',shadow:'none'},'copy icon has no frame or filled background, including on hover');
 }
 await btc.locator('a').first().focus();await page.keyboard.press('Tab');
 assert.ok(await copy.evaluate(button=>button===document.activeElement&&getComputedStyle(button).outlineStyle!=='none'),'keyboard focus remains visible');
 await page.evaluate(()=>{window.failCopy=true;});await copy.click();await btc.getByRole('alert').filter({hasText:'Could not copy address.'}).waitFor();
 await page.evaluate(()=>{window.failCopy=false;});await copy.click();assert.equal(await btc.getByRole('alert').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: wallet-focused From/To across ADA, BTC, ETH and SOL; name-only explorer links, full-address copy, clipboard failure recovery, address filtering and paid fees.');
}finally{await browser.close();}
