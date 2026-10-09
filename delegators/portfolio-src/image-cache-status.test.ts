import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCachedImages,watchImageCache} from './image-cache-status.ts';
const id='a'.repeat(56),url='/api/portfolio/images/'+'b'.repeat(64)+'.gif';
test('completed background images update only image metadata, never prices or analysis',()=>{
  const market={token_id:id,price_by_usd:4,decimals:6,name:'Original asset'},markets={[id]:market};
  const next=applyCachedImages(markets,{[id]:url,unknown:url});
  assert.deepEqual(next,{[id]:{...market,cached_image:url}});
  assert.deepEqual(markets,{[id]:market});
  assert.equal(applyCachedImages(next,{[id]:url}),next);
  assert.equal(applyCachedImages(markets,{[id]:'https://evil.test/image'}),markets);
});
test('pending downloads are discovered without repeating price or transaction requests',async()=>{
  let calls=0;const updates:unknown[]=[],waits:number[]=[];
  await watchImageCache([id],async ids=>{assert.deepEqual(ids,[id]);return {tokens:[++calls===1?{token_id:id,state:'pending'}:{token_id:id,state:'cached',cached_image:url}]};},images=>updates.push(images),new AbortController().signal,async ms=>{waits.push(ms);});
  assert.equal(calls,2);assert.deepEqual(updates,[{[id]:url}]);assert.deepEqual(waits,[5000]);
});
test('failed downloads are not requested again until their twelve-hour retry time',async()=>{
  let clock=1000,calls=0;const retryAt=clock+43200000;
  await watchImageCache([id],async()=>({tokens:[++calls===1?{token_id:id,state:'deferred',retryAt}:{token_id:id,state:'cached',cached_image:url}]}),()=>{},new AbortController().signal,async ms=>{assert.equal(ms,60000);clock=retryAt;},()=>clock);
  assert.equal(calls,2);
});
test('status checks stop when unavailable or cancelled and ignore unsolicited assets',async()=>{
  let calls=0;
  await watchImageCache([id],async()=>{calls++;return {tokens:[{token_id:'unknown',state:'cached',cached_image:url},{token_id:id,state:'unavailable'}]};},()=>assert.fail('unexpected image'),new AbortController().signal,async()=>assert.fail('unexpected wait'));
  assert.equal(calls,1);
  const control=new AbortController();control.abort();
  await watchImageCache([id],async()=>assert.fail('unexpected request'),()=>{},control.signal,async()=>{});
});
