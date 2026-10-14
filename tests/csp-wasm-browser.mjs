import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const {chromium}=await import(process.argv[2]);
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const headers=await readFile(new URL('../_headers',import.meta.url),'utf8');
const meta=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
const header=headers.match(/Content-Security-Policy: ([^\n]+)/)[1];
for(const policy of [meta,header]){
  assert.match(policy,/'wasm-unsafe-eval'/);
  assert.doesNotMatch(policy,/'unsafe-eval'|'unsafe-inline'/);
}
const probe=`(async()=>{
  const result={wasm:false,evalBlocked:false,functionBlocked:false};
  try{await WebAssembly.instantiate(new Uint8Array([0,97,115,109,1,0,0,0]));result.wasm=true;}catch{}
  try{eval('1+1');}catch{result.evalBlocked=true;}
  try{new Function('return 1')();}catch{result.functionBlocked=true;}
  window.cspResult=result;
})();`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  for(const mode of ['meta','header','both','blocked']){
    const page=await browser.newPage();
    await page.route('**/*',route=>{
      if(new URL(route.request().url()).pathname==='/probe.js')return route.fulfill({contentType:'text/javascript',body:probe});
      const policy=mode==='blocked'?header.replace(" 'wasm-unsafe-eval'",''):header;
      return route.fulfill({contentType:'text/html',headers:mode==='meta'?{}:{'Content-Security-Policy':policy},body:`<!doctype html><head>${mode==='meta'||mode==='both'?`<meta http-equiv="Content-Security-Policy" content="${meta}">`:''}<script src="/probe.js" defer></script></head><body></body>`});
    });
    await page.goto('http://127.0.0.1:8998/');
    await page.waitForFunction(()=>window.cspResult);
    assert.deepEqual(await page.evaluate(()=>window.cspResult),{wasm:mode!=='blocked',evalBlocked:true,functionBlocked:true},mode);
    await page.close();
  }
  console.log('PASS: header and meta CSP allow WebAssembly while blocking JavaScript eval and Function; original policy blocks Wasm.');
}finally{await browser.close();}
