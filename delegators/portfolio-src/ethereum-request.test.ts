import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ethereumRequest,waitForEthereumRetry} from './ethereum-request.ts';
const signal=()=>new AbortController().signal;
const limited=(code='upstream_rate_limit',retryAfter=60)=>Response.json({error:'Etherscan rate limit reached. Retry shortly.',code,retryAfter},{status:429});
test('temporary rate limits retry the same request and honor the cooldown',async()=>{
  let calls=0;const delays:number[]=[];
  const result=await ethereumRequest(async()=>++calls===1?limited():Response.json({transactions:['saved-range']}),signal(),async ms=>{delays.push(ms);});
  assert.deepEqual(result,{transactions:['saved-range']});assert.equal(calls,2);assert.deepEqual(delays,[60000]);
});
test('rate-limit retries are bounded and retain the terminal status',async()=>{
  let calls=0;
  await assert.rejects(ethereumRequest(async()=>{calls++;return limited();},signal(),async()=>{}),{status:429,code:'upstream_rate_limit'});
  assert.equal(calls,3);
});
test('daily quota, credential throttling and incomplete indexing never retry',async()=>{
  for(const code of ['quota_limit','invalid_key_throttled','community_limit','indexing_incomplete','history_window_limit']){
    let calls=0;
    await assert.rejects(ethereumRequest(async()=>{calls++;return limited(code);},signal(),async()=>assert.fail('unexpected retry')),{code});
    assert.equal(calls,1);
  }
});
test('older backend rate limits retry but long cooldowns stop',async()=>{
  let calls=0;
  await ethereumRequest(async()=>++calls===1?Response.json({error:'Etherscan rate limit reached. Retry shortly.'},{status:429}):Response.json({}),signal(),async ms=>assert.equal(ms,2000));
  assert.equal(calls,2);
  await assert.rejects(ethereumRequest(async()=>limited('upstream_rate_limit',86400),signal(),async()=>assert.fail('unexpected retry')),{status:429});
});
test('cancelling a retry stops subsequent requests',async()=>{
  const control=new AbortController();let calls=0;
  await assert.rejects(ethereumRequest(async()=>{calls++;return limited();},control.signal,async()=>{control.abort(new Error('cancelled'));}),/cancelled/);
  assert.equal(calls,1);
});
test('the real cooldown timer is abortable',async()=>{
  const control=new AbortController();const pending=waitForEthereumRetry(60000,control.signal);
  control.abort(new Error('cancelled'));
  await assert.rejects(pending,/cancelled/);
});
