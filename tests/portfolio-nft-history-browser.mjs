import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import {HistoricalNftCollage} from './App';import {NftHighlights} from './NftHistory';
const rows=Array.from({length:15},(_,i)=>({id:'a'.repeat(56)+i.toString(16).padStart(2,'0'),name:i===0?'Minted artwork':'Frigid #'+i,raw:'1',firstReceived:1700000000+i}));
const markets=Object.fromEntries(rows.map(row=>[row.id,{image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII='}]));
const events=rows.map((row,i)=>({id:row.id,name:row.name,hash:(i+1).toString(16).padStart(64,'0'),time:1699999000+i,raw:'1',kind:i===0?'Mint':'Received',price:null}));
events.unshift({id:rows[1].id,name:rows[1].name,hash:'b'.repeat(64),time:1700000301,raw:'-1',kind:'Sell',price:20},{id:rows[1].id,name:rows[1].name,hash:'c'.repeat(64),time:1700000001,raw:'1',kind:'Buy',price:10});
createRoot(document.getElementById('app')).render(<HistoricalNftCollage rows={rows} markets={markets} events={events}/>);`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')},plugins:[{name:'fixture',setup(build){build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('function HistoricalNftCollage(','export function HistoricalNftCollage(')}));}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setContent('<div id="app" class="member-portfolio" style="max-width:900px;margin:auto"></div>');
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  await page.getByText('Top collection',{exact:true}).waitFor();
  assert.match(await page.locator('.portfolio-nft-highlights').innerText(),/Minted artwork.*15 NFTs.*Fastest flip.*Frigid #1.*0d 0h 5m 0s/s);
  for(const width of [1200,390]){
    await page.setViewportSize({width,height:900});
    const search=page.getByRole('textbox',{name:'Search historical NFTs'});
    await search.fill('Minted artwork');
    await page.waitForFunction(()=>document.querySelectorAll('.portfolio-nft-tile').length===1);
    assert.match(await page.locator('.portfolio-nft-caption').innerText(),/Mint/);
    assert.doesNotMatch(await page.locator('.portfolio-nft-caption').innerText(),/Buy:/);
    await search.fill('');
    await page.waitForFunction(count=>document.querySelectorAll('.portfolio-nft-tile').length===count,width>=768?6:1);
    assert.match(await page.locator('.portfolio-nft-caption').first().innerText(),/Frigid #14/);
    await page.getByRole('button',{name:'Next page',exact:true}).click();
    assert.match(await page.locator('.portfolio-nft-caption').first().innerText(),width>=768?/Frigid #8/:/Frigid #13/);
    await search.fill('Minted artwork');
    await page.waitForFunction(()=>document.querySelectorAll('.portfolio-nft-tile').length===1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.locator('.portfolio-nft-timeline,.portfolio-nft-history-layout').count(),0,'no timeline or sidebar space remains');
    await page.waitForFunction(()=>document.querySelector('.portfolio-nft-highlights-layout').style.getPropertyValue('--nft-highlights-height'));
    const gallery=await page.locator('.portfolio-nft-gallery').boundingBox(),highlights=await page.locator('.portfolio-nft-highlights-layout > .portfolio-nft-highlights').boundingBox();
    if(width>=768){
      assert.ok(highlights.x>=gallery.x+gallery.width,'highlights sit right of the gallery');
      const tile=await page.locator('.portfolio-nft-tile').boundingBox();
      assert.ok(Math.abs(highlights.height-(tile.height*2+12))<2,'highlights match two stacked images');
    }else assert.ok(highlights.y+highlights.height<=gallery.y,'mobile highlights stack above the gallery');
    await page.screenshot({path:'/tmp/tdsp-nft-history-'+width+'.png',fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: highlights, mint captions and date-ordered gallery pagination fit desktop and mobile without a timeline.');
}finally{await browser.close();}
