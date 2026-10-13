import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import {HistoricalNftCollage} from './App';
const rows=Array.from({length:12},(_,i)=>({id:'a'.repeat(56)+i.toString(16).padStart(2,'0'),name:'Frigid #'+i,raw:'0',firstReceived:i?1704067200:null}));
const markets=Object.fromEntries(rows.map((row,i)=>[row.id,i===8?{}:{image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII='}]));
createRoot(document.getElementById('app')).render(<HistoricalNftCollage rows={rows} markets={markets}/>);`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'collage-fixture',setup(build){build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('function HistoricalNftCollage(','export function HistoricalNftCollage(')}));}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];
  await page.route('https://asset-logos.minswap.org/**',route=>route.abort());
  page.on('pageerror',error=>errors.push(error.message));
  await page.setContent('<div id="app" class="member-portfolio" style="max-width:900px;margin:auto"></div>');
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const button=document.createElement('button');button.textContent='Back';button.onclick=options.closeOverlay;overlay.append(button,...options.bodyNodes);document.body.append(overlay);return {overlay};};});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  const tiles=page.locator('.portfolio-nft-tile');await tiles.first().waitFor();
  await page.locator('.portfolio-nft-placeholder').waitFor();
  for(const width of [1200,390]){
    await page.setViewportSize({width,height:1000});
    const mobile=width<768;
    await page.waitForFunction(count=>document.querySelectorAll('.portfolio-nft-tile').length===count,mobile?1:9);
    assert.equal(await tiles.count(),mobile?1:9);
    assert.equal(await page.locator('.portfolio-nft-placeholder').count(),mobile?0:1);
    assert.equal(await page.locator('.portfolio-nft-caption').first().innerText(),'Frigid #0\nFirst received: unknown');
    if(!mobile)assert.match(await page.locator('.portfolio-nft-caption').nth(1).innerText(),/2024-01-01/);
    const columns=await page.locator('.portfolio-nft-collage').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length);
    assert.equal(columns,mobile?1:3);
    const grid=await page.locator('.portfolio-nft-collage').boundingBox();assert.ok(grid.height<=821,JSON.stringify(grid));
    for(const tile of await tiles.all()){
      const bounds=await tile.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width);
      assert.equal(await tile.evaluate(node=>node.scrollWidth<=node.clientWidth),true);
    }
    await page.screenshot({path:`/private/tmp/portfolio-nft-collage-${width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Next page',exact:true}).click();assert.equal(await tiles.count(),mobile?1:3);
    if(mobile)assert.match(await page.locator('.portfolio-nft-caption').innerText(),/Frigid #1/);
    await page.getByRole('button',{name:'Previous page',exact:true}).click();assert.equal(await tiles.count(),mobile?1:9);
    const button=page.locator('.portfolio-image-preview-button').first();await button.focus();await page.keyboard.press('Enter');
    await page.locator('.portfolio-image-preview').waitFor();
    await page.getByRole('button',{name:'Back',exact:true}).click();
    assert.equal(await button.evaluate(node=>node===document.activeElement),true);
  }
  assert.deepEqual(errors,[]);console.log('PASS: NFT collage caps pages at nine, fits desktop/mobile, shows dates/placeholders and opens image previews.');
}finally{await browser.close();}
