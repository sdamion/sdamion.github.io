import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.argv[2]||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  const tiles=Array.from({length:5},(_,i)=>`<div><strong>${i+1}</strong><span>Tile</span></div>`).join('');
  await page.setContent(`<main><div class="tdsp-tile-grid">${tiles}</div><div class="tdsp-tile-grid price-panel">${tiles}</div><div class="tdsp-tile-grid tdsp-tile-grid--three">${tiles}</div><section class="member-portfolio"><div class="tdsp-tile-grid">${tiles}</div></section></main>`);
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  for(const width of [360,390,480,700,860,1280]){
    await page.setViewportSize({width,height:900});
    const grids=await page.locator('.tdsp-tile-grid').evaluateAll(elements=>elements.map(element=>({
      columns:getComputedStyle(element).gridTemplateColumns.split(' ').length,
      boxes:[...element.children].map(child=>{const box=child.getBoundingClientRect();return {left:box.left,right:box.right,top:box.top,bottom:box.bottom};})
    })));
    if(width<=700)for(const grid of grids){
      assert.equal(grid.columns,1,`one column at ${width}px`);
      for(let i=1;i<grid.boxes.length;i++){
        assert.ok(grid.boxes[i].top>=grid.boxes[i-1].bottom,'tiles have separate rows');
        assert.ok(Math.abs(grid.boxes[i].left-grid.boxes[0].left)<1,'tiles align');
        assert.ok(grid.boxes[i].right<=width,'tiles fit the viewport');
      }
    }
    else assert.ok(grids[0].columns>1,'tablet and desktop keep multiple columns');
  }
  console.log('PASS: shared site, price, admin and Portfolio tiles use one mobile column; tablet and desktop remain multi-column.');
}finally{await browser.close();}
