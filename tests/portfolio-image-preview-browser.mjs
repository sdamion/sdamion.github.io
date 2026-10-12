import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build:bundleBuild}=require('esbuild'),{chromium}=await import(process.argv[2]);
const build=options=>bundleBuild({...options,alias:{'@/lib/portfolio':path.join(source,'core.ts'),'@/lib/portfolio-cache':path.join(source,'cache.ts'),'@/components/ui/input':path.join(source,'ui.tsx'),'@/components/ui/table':path.join(source,'ui.tsx'),'@/components/ui/pagination':path.join(source,'ui.tsx')}});
const bundle=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import {AssetImage} from './App';createRoot(document.getElementById('app')).render(<AssetImage id={'a'.repeat(56)} name="Frigid #407" market={{image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII='}} compact preview/>);`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'preview-fixture',setup(build){build.onLoad({filter:/\/App\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('function AssetImage(','export function AssetImage(')}));}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setContent('<div id="app" class="member-portfolio"></div>');
  await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
  await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('section');overlay.id=options.id;const button=document.createElement('button');button.textContent='Back';button.onclick=options.closeOverlay;overlay.append(button,...options.bodyNodes);document.body.append(overlay);return {overlay};};});
  await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
  const button=page.locator('.portfolio-image-preview-button');
  for(const width of [1200,390]){
    await page.setViewportSize({width,height:900});
    await button.focus();await page.keyboard.press('Enter');
    const preview=page.locator('.portfolio-image-preview');
    await preview.waitFor();
    assert.equal(await preview.getAttribute('alt'),'Frigid #407');
    assert.equal(await preview.getAttribute('src'),await button.locator('img').getAttribute('src'));
    const bounds=await preview.boundingBox();assert.ok(bounds.width<=width&&bounds.height<=675);
    await page.getByRole('button',{name:'Back',exact:true}).click();
    assert.equal(await preview.count(),0);assert.equal(await button.evaluate(node=>node===document.activeElement),true);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: transaction image preview opens by keyboard, fits desktop/mobile, reuses the image and restores focus.');
}finally{await browser.close();}
