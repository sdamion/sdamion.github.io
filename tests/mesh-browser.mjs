import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.argv[2]||'playwright');
const html=await readFile('index.html','utf8');
const policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
const mesh=await readFile('vendor/mesh.js','utf8');
for(const file of ['delegators/delegator-access.js','stake/stake.js','governance/governance.js']){
  const source=await readFile(file,'utf8');
  assert.match(source,/\.\.\/vendor\/mesh\.js\?v=1\.9\.1-local-20261030/);
  assert.doesNotMatch(source,/https:\/\/esm\.sh/);
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  const external=[];
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!=='http://127.0.0.1:8998'){external.push(url.href);return route.abort();}
    if(url.pathname==='/vendor/mesh.js')return route.fulfill({contentType:'text/javascript',body:mesh});
    return route.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':policy},body:'<!doctype html><title>Self-hosted Mesh</title>'});
  });
  await page.goto('http://127.0.0.1:8998/');
  const result=await page.evaluate(async()=>{
    const sdk=await import('/vendor/mesh.js?v=1.9.1-local-20261030');
    const names=['BrowserWallet','MeshTxBuilder','deserializePoolId','resolveRewardAddress','hashDrepAnchor'];
    for(const name of names)if(typeof sdk[name]!=='function')throw new Error('Missing export: '+name);
    const builder=new sdk.MeshTxBuilder({verbose:false});
    window.cardano={mock:{enable:async()=>({getNetworkId:async()=>1})}};
    const wallet=await sdk.BrowserWallet.enable('mock');
    const pool=sdk.deserializePoolId('pool1zfd0gl76h3f0ammgp4gu0qvt99qcqkn5a895wv0q779d6p9dz5u');
    const reward=sdk.resolveRewardAddress('addr1qy93p0cfydj548ayt6mh2z572ly4n4s9yaxwzrht2rzc3urjvlyhltxc0287yacjhg8syg4w3dyg3jal6ltksfuc483sel7r8c');
    const anchor=sdk.hashDrepAnchor({body:{givenName:'Offline SDK test'}});
    return {network:await wallet.getNetworkId(),pool,builder:!!builder,deposit:sdk.DREP_DEPOSIT,reward,anchor};
  });
  assert.equal(result.network,1);
  assert.equal(result.pool,'125af47fdabc52feef680d51c7818b2941805a74e9cb4731e0f78add');
  assert.equal(result.builder,true);
  assert.equal(result.reward,'stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr');
  assert.match(result.anchor,/^[a-f0-9]{64}$/);
  assert.ok(result.deposit!==undefined);
  assert.deepEqual(external,[]);
  console.log('PASS: self-hosted Mesh loads under CSP without CDN access; wallet enable, builder and pool decoding work.');
}finally{await browser.close();}
