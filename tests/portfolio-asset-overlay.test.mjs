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
    assert.ok(app.includes(`onOpen={()=>setSection('${section}')}`));
  }
  assert.match(source('ui.tsx'),/TDSPRuntime.appendUniversalTileContent\(button/);
  assert.match(source('ui.tsx'),/type="button".*onClick=\{onOpen\}/);
  assert.match(overlay,/titleId:`\$\{id\}-title`/);
  assert.match(overlay,/governance-dialog-wide/);
  assert.doesNotMatch(overlay,/\.css|abort\(|refresh\(/);
});
