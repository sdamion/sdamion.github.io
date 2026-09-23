import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=name=>readFileSync(new URL(`../delegators/portfolio-src/${name}`,import.meta.url),'utf8');
test('asset details use the universal overlay and retain the mounted portfolio',()=>{
  const overlay=source('AssetOverlay.tsx');
  assert.match(overlay,/host\.createUniversalOverlay\(/);
  assert.match(overlay,/createPortal\(children,body\)/);
  assert.match(overlay,/showClose:false,showBack:true/);
  assert.match(overlay,/elements\.overlay\.remove\(\)/);
  assert.match(overlay,/syncGovernanceMenuOverlayAccessibility/);
  assert.doesNotMatch(overlay,/abort\(|unmount\(|refresh\(/);
});
test('holdings show names below images and move payment details into the overlay',()=>{
  const app=source('App.tsx');
  assert.match(app,/\{image\}<span className="portfolio-asset-name"/);
  assert.match(app,/onOpen=\{\(\)=>setSelectedAsset\(r.id\)\}/);
  assert.doesNotMatch(app,/<TableCell>[^\n]*<PaymentLinks/);
  assert.doesNotMatch(source('PaymentLinks.tsx'),/<details|<summary/);
});
test('portfolio sections use separate shared overlays and the universal tile renderer',()=>{
  const app=source('App.tsx'),overlay=source('AssetOverlay.tsx');
  for(const section of ['wallets','holdings','transactions']){
    assert.ok(app.includes(`section==='${section}'&&<AssetOverlay id="portfolio-${section}-overlay"`));
    assert.ok(app.includes(`setSection('${section}')`));
  }
  assert.match(source('ui.tsx'),/TDSPRuntime.appendUniversalTileContent\(button/);
  assert.match(source('ui.tsx'),/role="button" tabIndex=\{0\}/);
  assert.match(source('ui.tsx'),/onKeyDown=/);
  assert.match(overlay,/titleId:`\$\{id\}-title`/);
  assert.match(overlay,/governance-dialog-wide/);
  assert.doesNotMatch(overlay,/\.css|abort\(|refresh\(/);
});
test('cache upload status belongs to the Transactions tile rather than the refresh header',()=>{
  const app=source('App.tsx');
  const header=app.slice(app.indexOf('aria-label="Portfolio refresh"'),app.indexOf('<MenuTile title="Transactions"'));
  assert.doesNotMatch(header,/CacheUploadProgress|\{cacheNotice/);
  assert.match(app,/<MenuTile title="Transactions"[\s\S]*?<CacheUploadProgress[\s\S]*?<\/MenuTile>/);
  assert.match(source('ui.tsx'),/createPortal\(children,footer\)/);
});
test('CEX metric opens the shared transaction list without stale search or pagination',()=>{
  const app=source('App.tsx');
  assert.match(app,/<Metric label="ADA Gain\/ loss"[^\n]*onOpen=\{\(\)=>\{setQuery\(''\);setFilter\('cex'\);setPage\(0\);setSection\('transactions'\);\}\}/);
  const tile=app.split('\n').find(line=>line.includes('<Metric label="ADA Gain/ loss"'));
  assert.doesNotMatch(tile,/note=|breakdown=|Bought|Sold/);
  const transactions=app.slice(app.indexOf("{section==='transactions'"),app.indexOf('{busy&&<p'));
  assert.match(transactions,/ADA OUT <AdaUsdAmount/);
  assert.match(transactions,/ADA IN <AdaUsdAmount/);
  assert.match(transactions,/transfer-day prices/);
  assert.match(app,/<MenuTile title="Transactions"[^\n]*setFilter\('all'\)/);
  assert.match(app,/const Tag=onOpen\?'button':'div'/);
});
test('closing Portfolio detaches its view without unmounting the active refresh',()=>{
  const entry=source('entry.tsx');
  const close=entry.slice(entry.indexOf('// Closing the view'));
  assert.match(close,/instance.content.remove\(\)/);
  assert.doesNotMatch(close,/root.unmount|abort\(/);
  assert.match(entry,/if\(!portfolioInstance\)/);
  assert.match(entry,/addEventListener\('tdsp:portfolio-session-expired',instance.destroy\)/);
  assert.match(entry,/portfolioInstance.role!==role\)portfolioInstance.destroy\(\)/);
  assert.match(source('App.tsx'),/tdsp:portfolio-hidden/);
});
test('CEX timeline reuses the shared chart loader and frame inside the overlay',()=>{
  assert.match(source('App.tsx'),/filter==='cex'[^\n]*<CexTimeline/);
  const timeline=source('CexTimeline.tsx');
  assert.match(timeline,/TDSPCharts.load\(\)/);
  assert.match(timeline,/price-history-chart-frame/);
  assert.match(timeline,/maxTicksLimit:5/);
  assert.match(timeline,/chart\?\.destroy\(\)/);
  assert.doesNotMatch(timeline,/<Table|<Pagination|<h3/);
  assert.doesNotMatch(timeline,/\.css/);
});
test('gain loss overlay puts the breakdown above its graph, not in address settings',()=>{
  const app=source('App.tsx');
  const exchange=app.slice(app.indexOf("{section==='wallets'"),app.indexOf("{section==='holdings'"));
  assert.doesNotMatch(exchange,/ADA Gain\/ loss breakdown/);
  const section=app.slice(app.indexOf("{section==='transactions'"),app.indexOf('{busy&&<p'));
  assert.ok(section.indexOf('ADA Gain/ loss breakdown')<section.indexOf('<CexTimeline'));
  assert.match(section,/ADA OUT <AdaUsdAmount[^\n]*ada=\{Number\(cexPosition.sentRaw\)\/1e6\} usd=\{cexDollars.soldUsd\}/);
  assert.doesNotMatch(section,/In wallets <AdaUsdAmount/);
  assert.match(section,/ADA IN <AdaUsdAmount[^\n]*ada=\{Number\(cexPosition.receivedRaw\)\/1e6\} usd=\{cexDollars.boughtUsd\}/);
  assert.match(source('CexTimeline.tsx'),/label:'ADA IN',data:points.map\(p=>\(\{x:p.time\*1000,y:p.boughtAda,usd:p.boughtUsd/);
  assert.match(source('CexTimeline.tsx'),/label:'ADA OUT',data:points.map\(p=>\(\{x:p.time\*1000,y:p.soldAda,usd:p.soldUsd/);
  assert.doesNotMatch(section,/<details>/);
});
test('Cardano Wallets combines address management in one shared overlay',()=>{
  const app=source('App.tsx');
  assert.match(app,/<MenuTile title="Cardano Wallets"/);
  assert.doesNotMatch(app,/<MenuTile title="(?:Wallet addresses|DEX \/ CEX addresses)"|portfolio-exchanges-overlay/);
  const wallets=app.slice(app.indexOf("{section==='wallets'"),app.indexOf("{section==='holdings'"));
  assert.match(wallets,/name="Cardano Wallets"/);
  assert.match(wallets,/<h2 id="portfolio-wallet-addresses-title">Wallet addresses<\/h2>/);
  assert.match(wallets,/<h2 id="portfolio-exchange-addresses-title">DEX \/ CEX addresses<\/h2>/);
  assert.match(wallets,/<CexAddresses/);
});
test('ADA across wallets opens holdings without a duplicate navigation tile',()=>{
  const app=source('App.tsx');
  assert.match(app,/<Metric label="ADA across wallets"[^\n]*onOpen=\{\(\)=>setSection\('holdings'\)\}/);
  assert.doesNotMatch(app,/<MenuTile title="Current holdings & performance"/);
  assert.match(app,/id="portfolio-holdings-overlay" name="ADA across wallets"/);
  assert.match(app,/onOpen=\{\(\)=>setSelectedAsset\(r.id\)\}/);
});
