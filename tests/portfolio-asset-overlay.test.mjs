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
test('holdings show names with images and move payment details into the overlay',()=>{
  const app=source('App.tsx');
  assert.match(app,/\{image\}<span className="portfolio-asset-name"/);
  assert.match(app,/onOpen=\{\(\)=>setSelectedAsset\(r.id\)\}/);
  assert.doesNotMatch(app,/<TableCell>[^\n]*<PaymentLinks/);
  assert.doesNotMatch(source('PaymentLinks.tsx'),/<details|<summary/);
});
test('portfolio sections use separate shared overlays and the universal tile renderer',()=>{
  const app=source('App.tsx'),overlay=source('AssetOverlay.tsx');
  for(const section of ['wallets','holdings']){
    assert.ok(app.includes(`section==='${section}'&&<AssetOverlay id="portfolio-${section}-overlay"`));
    assert.ok(app.includes(`setSection('${section}')`));
  }
  assert.match(app,/id=\{section==='gain-loss'\?'portfolio-gain-loss-overlay':'portfolio-transactions-overlay'\}/);
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
test('CEX metric opens its shared transaction overlay without stale search or pagination',()=>{
  const app=source('App.tsx');
  assert.match(app,/<Metric label="CEX Transactions"[^\n]*onOpen=\{\(\)=>\{setQuery\(''\);setFilter\('all'\);setPage\(0\);setSection\('gain-loss'\);\}\}/);
  const tile=app.split('\n').find(line=>line.includes('<Metric label="CEX Transactions"'));
  assert.doesNotMatch(tile,/note=|breakdown=|Bought|Sold/);
  assert.match(app,/<ComparisonAmount amount=\{comparison\?\.incoming\?\?null\}/);
  assert.match(app,/<ComparisonAmount amount=\{comparison\?\.outgoing\?\?null\}/);
  assert.match(app,/Transfer-day prices plus current wallet value/);
  assert.match(app,/<MenuTile title="Transactions"[^\n]*setFilter\('all'\)/);
  assert.match(app,/const Tag=onOpen\?'button':'div'/);
});
test('gain loss shares date filters and both transaction pagers, and filters its graph',()=>{
  const app=source('App.tsx'),chart=source('CexTimeline.tsx');
  const start=app.indexOf("{(section==='transactions'");
  const section=app.slice(start,app.indexOf('{busy&&<p',start));
  assert.ok(section.indexOf('<CexTimeline')<section.indexOf('<TransactionFilters'));
  assert.ok(section.indexOf('<TransactionFilters')<section.indexOf('<TransactionTable'));
  assert.match(app,/<CexTimeline[^\n]*dateFrom=\{dateFrom\} dateTo=\{dateTo\}/);
  for(const position of ['top','bottom'])assert.ok(app.includes(`<TransactionPagination position="${position}"`));
  assert.match(chart,/withinTransactionDates\(fact.time,dateFrom,dateTo\)/);
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
  assert.match(source('App.tsx'),/section==='gain-loss'&&<>/);
  const timeline=source('CexTimeline.tsx');
  assert.match(timeline,/TDSPCharts.load\(\)/);
  assert.match(timeline,/price-history-chart-frame/);
  assert.match(timeline,/siteChartDefaults\(canvas.current\)/);
  assert.match(timeline,/legend:defaults.legend/);
  assert.match(timeline,/\.\.\.defaults.tooltip/);
  assert.match(timeline,/chart\?\.destroy\(\)/);
  assert.doesNotMatch(timeline,/<Table|<Pagination|<h3/);
  assert.doesNotMatch(timeline,/\.css/);
});
test('gain loss overlay places its breakdown beside the graph, not in address settings',()=>{
  const app=source('App.tsx');
  const exchange=app.slice(app.indexOf("{section==='wallets'"),app.indexOf("{section==='holdings'"));
  assert.doesNotMatch(exchange,/ADA Gain\/ loss breakdown/);
  const start=app.indexOf("{(section==='transactions'");
  const section=app.slice(start,app.indexOf('{busy&&<p',start));
  assert.match(section,/className="tdsp-chart-overview portfolio-gain-overview"/);
  assert.ok(section.indexOf('<CexTimeline')<section.indexOf('ADA Gains/Loss breakdown'));
  assert.match(section,/variant="comparison"/);
  assert.match(section,/<ComparisonAmount amount=\{comparison\?\.outgoing\?\?null\} value=\{comparison\?\.outFiat\?\?null\}/);
  assert.doesNotMatch(section,/In wallets <AdaUsdAmount/);
  assert.match(section,/<ComparisonAmount amount=\{comparison\?\.incoming\?\?null\} value=\{comparison\?\.inFiat\?\?null\}/);
  assert.match(source('CexTimeline.tsx'),/label:crypto\+' IN',data:points.map\(p=>\(\{x:p.time\*1000,y:p.incoming,fiat:p.inFiat/);
  assert.match(source('CexTimeline.tsx'),/label:crypto\+' OUT',[^\n]*data:points.map\(p=>\(\{x:p.time\*1000,y:p.outgoing,fiat:p.outFiat/);
  assert.doesNotMatch(section,/<details>/);
});
test('Cardano Wallets uses shared section tiles and nested address overlays',()=>{
  const app=source('App.tsx');
  assert.match(app,/<MenuTile title="Cardano Wallets"/);
  assert.doesNotMatch(app,/<MenuTile title="(?:Wallet addresses|DEX \/ CEX addresses)"|portfolio-exchanges-overlay/);
  const wallets=app.slice(app.indexOf("{section==='wallets'"),app.indexOf("{section==='holdings'"));
  assert.match(wallets,/name="Cardano Wallets"/);
  assert.match(wallets,/<WalletMenu/);
  const menu=source('WalletMenu.tsx');
  for(const title of ['My Wallets','DEX / CEX','Byron DEX / CEX'])assert.ok(menu.includes(title));
  assert.match(menu,/<MenuTile/);
  assert.match(menu,/<AssetOverlay/);
  assert.match(menu,/onClose=\{\(\)=>setSection\(null\)\}/);
  assert.match(wallets,/<CexAddresses[^\n]*swap=\{\{wallets/);
});
test('Assets opens holdings without a duplicate navigation tile',()=>{
  const app=source('App.tsx');
  assert.match(app,/<MenuTile title="Assets"[^\n]*setSection\('holdings'\)/);
  assert.doesNotMatch(app,/<MenuTile title="Current holdings & performance"/);
  assert.match(app,/id="portfolio-holdings-overlay" name=\{holdingsGroup\|\|'Assets'\}/);
  assert.match(app,/onOpen=\{\(\)=>setSelectedAsset\(r.id\)\}/);
});
