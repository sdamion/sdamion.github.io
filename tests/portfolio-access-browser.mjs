import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.argv[2]);
const source=await readFile('delegators/delegator-access.js','utf8');
const render=source.slice(source.indexOf('function renderPortfolioAccess('),source.indexOf('function renderExcludedStakeKeys('));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.setContent('<main><div id="portfolio-access-list"></div><p id="portfolio-access-status" role="status"></p></main>');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addStyleTag({content:await readFile('delegators/raffle.css','utf8')});
 await page.addScriptTag({content:`
 const ENDPOINTS={portfolioAccess:'/api/raffle/admin/portfolio-access'};
 const t=value=>value;
 const setTranslatedText=(element,value)=>element.textContent=value;
 const shorten=value=>value.slice(0,16)+'...'+value.slice(-10);
 const addressLine=value=>{const line=document.createElement('p');line.textContent=shorten(value);return line;};
 window.calls=[];window.failSave=false;
 const authorizedRequest=async(url,options)=>{const body=JSON.parse(options.body);window.calls.push({url,method:options.method,body});if(window.failSave)throw new Error('Save failed');return body;};
 ${render}
 window.payload={capabilities:{portfolio_access:true},portfolio_delegators:[
  {stake_address:'stake1'+'q'.repeat(53),ada_handle:'$alice',ethereum:false,solana:false},
  {stake_address:'stake1'+'r'.repeat(53),ada_handle:'$bob',ethereum:false,solana:true}
 ]};renderPortfolioAccess(window.payload);`});
 const aliceEth=page.getByRole('checkbox',{name:'ETH: $alice',exact:true});
 const aliceSol=page.getByRole('checkbox',{name:'SOL: $alice',exact:true});
 await aliceEth.check();
 await page.getByRole('status').filter({hasText:'Portfolio access saved.'}).waitFor();
 assert.equal(await aliceEth.isChecked(),true);assert.equal(await aliceSol.isChecked(),false);
 assert.equal(await page.getByRole('checkbox',{name:'SOL: $bob',exact:true}).isChecked(),true);
 const saved=await page.evaluate(()=>window.calls[0]);
 assert.equal(saved.method,'PUT');assert.equal(saved.body.ethereum,true);assert.equal(saved.body.solana,false);
 await aliceEth.uncheck();assert.equal(await aliceEth.isChecked(),false);
 await page.evaluate(()=>window.failSave=true);
 await aliceSol.click();
 await page.getByRole('status').filter({hasText:'Save failed'}).waitFor();
 assert.equal(await aliceSol.isChecked(),false,'failed save restores the prior grant');
 for(const width of [1200,390]){
  await page.setViewportSize({width,height:800});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:'/tmp/tdsp-portfolio-access-'+width+'.png',fullPage:true});
 }
 await page.evaluate(()=>renderPortfolioAccess({...window.payload,capabilities:{}}));
 assert.equal(await page.getByRole('checkbox').first().isDisabled(),true,'old backends fail closed');
 console.log('PASS: independent per-delegator ETH/SOL switches, saves, revocation, rollback and responsive layout.');
}finally{await browser.close();}
