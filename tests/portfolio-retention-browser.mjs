import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]||'playwright');
const bundle=await build({entryPoints:[path.resolve('delegators/portfolio-src/local-store.ts')],bundle:true,write:false,format:'esm'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  await page.route('**/*',route=>route.fulfill({contentType:route.request().url().endsWith('/store.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/store.js')?bundle.outputFiles[0].text:'<!doctype html><title>Retention test</title>'}));
  await page.goto('http://127.0.0.1:8999/');
  const result=await page.evaluate(async()=>{
    const {loadLocal,saveLocal}=await import('/store.js');
    const day=24*60*60*1000,started=Date.now();let now=started;
    const realNow=Date.now;Date.now=()=>now;
    try{
      const original=await saveLocal('member',{encrypted_version:1,payload:'test-only'},null,started+365*day);
      now=started+364*day;
      const retained=await loadLocal('member');
      if(!retained)throw new Error('Deleted before one year');
      const saved=await saveLocal('member',retained.data,retained.revision,retained.expires_at);
      if(saved.expires_at!==original.expires_at)throw new Error('Background write extended retention');
      now=started+365*day;
      if(await loadLocal('member'))throw new Error('Not deleted at one year');
      const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('tdsp-portfolio-local',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
      await new Promise((resolve,reject)=>{const tx=db.transaction('members','readwrite');tx.objectStore('members').put({revision:'legacy',expires_at:started+7*day,data:{encrypted_version:1,payload:'legacy-test-only'}},'legacy');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      db.close();now=started+8*day;
      const migrated=await loadLocal('legacy');
      if(migrated?.expires_at!==started+365*day)throw new Error('Legacy deadline not migrated');
      const reread=await loadLocal('legacy');
      if(reread?.expires_at!==migrated.expires_at)throw new Error('Migration extended twice');
      if(reread.data.payload!=='legacy-test-only')throw new Error('Migration changed payload');
      now=started+365*day;
      if(await loadLocal('legacy'))throw new Error('Migrated data did not expire');
      return true;
    }finally{Date.now=realNow;}
  });
  assert.equal(result,true);
  console.log('PASS: 365-day expiry, legacy migration, immutable payloads and no extension on background saves.');
}finally{await browser.close();}
