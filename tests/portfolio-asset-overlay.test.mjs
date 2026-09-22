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
  for(const section of ['wallets','exchanges','holdings','transactions']){
    assert.ok(app.includes(`section==='${section}'&&<AssetOverlay id="portfolio-${section}-overlay"`));
    assert.ok(app.includes(`setSection('${section}')`));
  }
  assert.match(source('ui.tsx'),/TDSPRuntime.appendUniversalTileContent\(button/);
  assert.match(source('ui.tsx'),/type="button".*onClick=\{onOpen\}/);
  assert.match(overlay,/titleId:`\$\{id\}-title`/);
  assert.match(overlay,/governance-dialog-wide/);
  assert.doesNotMatch(overlay,/\.css|abort\(|refresh\(/);
});
test('CEX metric opens the shared transaction list without stale search or pagination',()=>{
  const app=source('App.tsx');
  assert.match(app,/<Metric label="ADA gain \/ loss · CEX \+ wallets"[^\n]*onOpen=\{\(\)=>\{setQuery\(''\);setFilter\('cex'\);setPage\(0\);setSection\('transactions'\);\}\}/);
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
