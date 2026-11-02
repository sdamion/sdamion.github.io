import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
 import {createRoot} from 'react-dom/client';import {OwnedAssetsGallery} from './OwnedAssetsGallery';
 const rows=Array.from({length:24},(_,i)=>{const id=i.toString(16).padStart(64,'0')+'i0',name='Artwork '+String(i).padStart(2,'0');
  return {chain:'bitcoin',id:'bitcoin:'+i,standard:'Ordinal',name,symbol:'',raw:'1',decimals:0,wallets:['Test wallet'],image:i%2?'https://ordiscan.com/content/'+id:null,explorer:null,
   ...(i%2?{}:{ordinal:{id:'bitcoin:ordinal:'+id,name,raw:'1',firstReceived:null,ordinal:{id,number:i,contentType:'text/html',collection:null,ownedWallets:['Test wallet']}}})};});
 createRoot(document.getElementById('root')).render(<OwnedAssetsGallery rows={rows} busy={false} partial={false} errors={[]} onRefresh={()=>{}}/>);
 `},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const width of [1200,390]){
  const page=await browser.newPage({viewport:{width,height:500}}),requests=[],errors=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='ordiscan.com'){
    requests.push(url.pathname);await new Promise(resolve=>setTimeout(resolve,100));
    const i=parseInt(url.pathname.split('/').pop().slice(0,64),16);
    return i%2?route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="green"/></svg>'}):route.fulfill({contentType:'text/html',body:'<canvas width="100" height="100"></canvas><script>document.querySelector("canvas").getContext("2d").fillRect(0,0,100,100)</script>'});
   }
   return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root" class="member-portfolio"></div>'});
  });
  await page.goto('http://127.0.0.1:8999/');
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;overlay.style.cssText='position:fixed;inset:0;background:white';const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  await page.getByRole('button',{name:'View Artwork 00 details',exact:true}).waitFor();
  await page.waitForFunction(()=>!!document.querySelector('iframe'));
  assert.equal(await page.locator('.portfolio-nft-tile').count(),24,'all names remain immediately available');
  const lastId=(22).toString(16).padStart(64,'0')+'i0',last=page.locator('[data-inscription="'+lastId+'"]');
  assert.equal(await last.locator('iframe').count(),0,'distant recursive artwork does not start');
  assert.equal(requests.includes('/content/'+lastId),false);
  assert.ok(await page.locator('.portfolio-nft-tile iframe,.portfolio-nft-tile img').count()<24,'nearby artwork is prioritized');
  await last.scrollIntoViewIfNeeded();await last.frameLocator('iframe').locator('canvas').waitFor();
  assert.equal(await last.locator('iframe').getAttribute('sandbox'),'allow-scripts');
  const before=requests.filter(value=>value==='/content/'+lastId).length;
  await page.getByRole('button',{name:'View Artwork 00 details',exact:true}).scrollIntoViewIfNeeded();await last.scrollIntoViewIfNeeded();
  assert.equal(requests.filter(value=>value==='/content/'+lastId).length,before,'scrolling back keeps an initialized preview');
  await last.getByRole('button').click();const overlay=page.locator('#portfolio-ordinal-preview-overlay');
  await overlay.frameLocator('iframe').locator('canvas').waitFor();
  assert.equal(await overlay.locator('iframe').getAttribute('loading'),'eager');
  assert.equal(await overlay.locator('iframe').getAttribute('sandbox'),'allow-scripts');
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: nearby artwork starts first, distant recursive previews are deferred, initialized frames survive scrolling, explicit previews load eagerly, and sandboxing is preserved on desktop/mobile.');
}finally{await browser.close();}
