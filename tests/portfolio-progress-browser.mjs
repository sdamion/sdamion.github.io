import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src');
const require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`
import {createRoot} from 'react-dom/client';
import {MenuTile} from './ui';
import {DownloadStatus} from './DownloadStatus';
import {combinedTransactionProgress} from './download-progress';
const root=createRoot(document.getElementById('app'));
window.renderProgress=(total)=>{
  const chains=[{chain:'ADA',progress:{downloaded:21591,total:21591}},{chain:'ETH',progress:{downloaded:266,total}},{chain:'SOL',progress:{downloaded:778,total:778}}];
  const progress=combinedTransactionProgress(chains.map(row=>row.progress));
  root.render(<MenuTile title="Transactions" value={String(progress.downloaded)} onOpen={()=>{}} analysis={{done:progress.downloaded,total:progress.total,counting:false,busy:false}}><DownloadStatus chains={chains}/></MenuTile>);
};
window.renderProgress(null);`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.setContent('<div id="app"></div>');
 await page.evaluate(()=>{window.TDSPRuntime={appendUniversalTileContent(node,{title,primaryText}){node.textContent=title+' '+primaryText;}};});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const bar=page.getByRole('progressbar');
 await bar.waitFor({state:'attached'});
 assert.equal(await bar.getAttribute('aria-valuenow'),null,'unknown ETH total has no numeric percentage, even when idle');
 assert.equal(await page.getByText('100%',{exact:true}).count(),0);
 assert.match(await page.locator('#app').innerText(),/ETH: 266 \/ 266 transactions/,'cached ETH total stays visible during discovery');
 assert.match(await page.locator('#app').innerText(),/Checking for additional transactions/);
 await page.evaluate(()=>window.renderProgress(266));
 await page.getByText('100%',{exact:true}).waitFor();
 assert.equal(await bar.getAttribute('aria-valuenow'),'100','all chains complete permit 100%');
 await page.evaluate(()=>window.renderProgress(null));
 await page.waitForFunction(()=>!document.querySelector('[role="progressbar"]').hasAttribute('aria-valuenow'));
 assert.equal(await page.getByText('100%',{exact:true}).count(),0,'a new incomplete scan clears the previous percentage');
 console.log('PASS: mixed-chain progress stays indeterminate until every total is known.');
}finally{await browser.close();}
