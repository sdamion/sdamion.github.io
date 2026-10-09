import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestWithPortfolioLimit} from './portfolio-limit.ts';
const limited=()=>Response.json({code:'portfolio_rate_limit',retryAfter:59},{status:429,headers:{'Retry-After':'59'}});
test('local Portfolio limit waits for the remaining window then resumes the same request',async()=>{
  let calls=0;const waits:number[]=[];
  const result=await requestWithPortfolioLimit(async()=>++calls===1?limited():Response.json({ok:true}),new AbortController().signal,async ms=>{waits.push(ms);});
  assert.equal(result.status,200);assert.deepEqual(await result.json(),{ok:true});
  assert.equal(calls,2);assert.deepEqual(waits,[59000]);
});
test('provider 429s are left to their provider-specific retry policy',async()=>{
  const result=await requestWithPortfolioLimit(async()=>Response.json({code:'upstream_rate_limit'},{status:429}),new AbortController().signal,async()=>assert.fail('unexpected wait'));
  assert.equal(result.status,429);assert.equal((await result.json()).code,'upstream_rate_limit');
});
test('JSON cooldown works when upload response headers are unavailable',async()=>{
  let calls=0;
  const result=await requestWithPortfolioLimit(async()=>++calls===1?Response.json({code:'portfolio_rate_limit',retryAfter:10},{status:429,headers:{'Retry-After':''}}):Response.json({}),new AbortController().signal,async ms=>assert.equal(ms,10000));
  assert.equal(result.status,200);assert.equal(calls,2);
});
test('Portfolio retries are bounded and preserve the final error body',async()=>{
  let calls=0;
  const result=await requestWithPortfolioLimit(async()=>{calls++;return limited();},new AbortController().signal,async()=>{});
  assert.equal(calls,3);assert.equal((await result.json()).code,'portfolio_rate_limit');
});
test('cancellation during a Portfolio cooldown prevents further calls',async()=>{
  const control=new AbortController();let calls=0;
  await assert.rejects(requestWithPortfolioLimit(async()=>{calls++;return limited();},control.signal,async()=>{control.abort(new Error('cancelled'));}),/cancelled/);
  assert.equal(calls,1);
});
