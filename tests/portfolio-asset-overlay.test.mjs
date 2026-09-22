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
