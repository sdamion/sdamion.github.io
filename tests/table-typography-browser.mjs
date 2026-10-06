import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.argv[2]||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  const table=className=>`<div class="table-shell"><table class="${className}"><thead><tr><th>Amount</th><th>Wallet</th></tr></thead><tbody><tr><td data-label="Amount">100 ADA <span class="small muted">Price</span></td><td data-label="Wallet"><a class="address">Address</a></td></tr></tbody></table></div>`;
  await page.setContent(`${table('')}<section class="member-portfolio">${table('portfolio-holdings-table tdsp-table--numeric')}${table('portfolio-gain-comparison tdsp-table--comparison')}${table('portfolio-transfer-row tdsp-table--numeric')}</section>`);
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.evaluate(()=>{
    const fields='<input value="Wallet"><select><option>ADA</option></select><button class="governance-vote-secondary">Add</button>';
    const standard=document.createElement('section');standard.id='standard-controls';standard.innerHTML=fields;
    const portfolio=document.createElement('section');portfolio.className='member-portfolio';portfolio.innerHTML=`<div id="portfolio-controls" class="portfolio-transaction-toolbar">${fields}</div>`;
    document.body.append(standard,portfolio);
  });
  for(const width of [390,700,860,1280]){
    await page.setViewportSize({width,height:900});
    const tables=await page.locator('.table-shell table').evaluateAll(elements=>elements.map(element=>{
      const style=getComputedStyle(element),cell=getComputedStyle(element.querySelector('td'));
      return {size:style.fontSize,family:style.fontFamily,line:style.lineHeight,cellSize:cell.fontSize,notes:[...element.querySelectorAll('.small,.address')].map(node=>getComputedStyle(node).fontSize)};
    }));
    for(const table of tables){
      assert.equal(table.size,tables[0].size,`shared table font at ${width}px`);
      assert.equal(table.family,tables[0].family);
      assert.equal(table.line,tables[0].line);
      assert.equal(table.cellSize,table.size,'comparison cells inherit the standard font');
      assert.ok(table.notes.every(size=>size===table.size),'nested text uses the same table font');
      assert.ok(parseFloat(table.size)>=14,'mobile table text is not shrunk');
    }
    const controls=await page.evaluate(()=>{
      const properties=['backgroundColor','borderColor','borderRadius','padding','minHeight','fontSize','fontWeight'];
      const styles=(id,selector)=>{const style=getComputedStyle(document.querySelector(`#${id} ${selector}`));return Object.fromEntries(properties.map(property=>[property,style[property]]));};
      return ['input','select','button'].map(selector=>({standard:styles('standard-controls',selector),portfolio:styles('portfolio-controls',selector)}));
    });
    for(const {standard,portfolio} of controls){
      // Buttons inherit their container text size; their visual controls share defaults.
      delete standard.fontSize;delete portfolio.fontSize;
      assert.deepEqual(portfolio,standard,'Portfolio controls use the shared site defaults');
    }
  }
  console.log('PASS: site and Portfolio tables share typography on desktop, tablet and mobile.');
}finally{await browser.close();}
