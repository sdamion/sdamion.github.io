import assert from 'node:assert/strict';
import {test} from 'node:test';
import {refreshMarketBatches} from './market-refresh.ts';

test('100-token batches, two concurrent reads, ordered serial cache writes and unique assets',async()=>{
  const ids=Array.from({length:450},(_,i)=>String(i)),requested:string[][]=[],applied:number[]=[],counts:number[]=[];
  let running=0,peak=0,writing=false;
  const ok=await refreshMarketBatches([...ids,...ids.slice(0,10)],async batch=>{
    requested.push(batch);peak=Math.max(peak,++running);
    await new Promise(resolve=>setTimeout(resolve,batch[0]==='0'?20:1));running--;return Number(batch[0]);
  },async value=>{
    assert.equal(writing,false);writing=true;await new Promise(resolve=>setTimeout(resolve,1));applied.push(value);writing=false;
  },(done,total)=>{assert.equal(total,5);counts.push(done);},new AbortController().signal);
  assert.equal(ok,true);assert.equal(peak,2);
  assert.deepEqual(requested.map(batch=>batch.length),[100,100,100,100,50]);
  assert.deepEqual(requested.flat(),ids);assert.deepEqual(applied,[0,100,200,300,400]);
  assert.equal(counts.at(-1),5);assert.ok(counts.every((value,index)=>!index||value>=counts[index-1]));
});

test('an unrecoverable optional batch keeps its successful peer and later batches',async()=>{
  const requested:number[]=[],applied:number[]=[];
  const ok=await refreshMarketBatches(Array.from({length:300},(_,i)=>String(i)),async batch=>{
    const id=Number(batch[0]);requested.push(id);if(id===0)throw new Error('Unavailable');return id;
  },async value=>{applied.push(value);},()=>{},new AbortController().signal);
  assert.equal(ok,false);assert.deepEqual(requested,[0,100,0,50,200]);assert.deepEqual(applied,[50,100,200]);
});

test('oversized or slow batches recover through two 50-token requests without repeating successful peers',async()=>{
  const requested:string[][]=[],applied:string[][]=[];
  const ok=await refreshMarketBatches(Array.from({length:300},(_,i)=>String(i)),async batch=>{
    requested.push(batch);if(batch[0]==='0'&&batch.length===100)throw Object.assign(new Error('Too large'),{status:413});return batch;
  },async value=>{applied.push(value);},()=>{},new AbortController().signal);
  assert.equal(ok,true);assert.deepEqual(requested.map(batch=>[batch[0],batch.length]),[['0',100],['100',100],['0',50],['50',50],['200',100]]);
  assert.deepEqual(applied.flat(),Array.from({length:300},(_,i)=>String(i)));
});

test('auth, quota and invalid response failures do not retry or start later batches',async()=>{
  for(const reason of [{status:401},{status:403},{status:429},{code:'invalid_token_data'}]){
    const requested:string[]=[],applied:string[]=[];
    const ok=await refreshMarketBatches(Array.from({length:300},(_,i)=>String(i)),async batch=>{
      requested.push(batch[0]);if(batch[0]==='0')throw reason;return batch[0];
    },async value=>{applied.push(value);},()=>{},new AbortController().signal);
    assert.equal(ok,false);assert.deepEqual(requested,['0','100']);assert.deepEqual(applied,['100']);
  }
});

test('cancellation prevents publishing fetched data; an empty list makes no requests',async()=>{
  const control=new AbortController();let applied=false;
  await assert.rejects(refreshMarketBatches(['a'],async()=>{control.abort();return 1;},async()=>{applied=true;},()=>{},control.signal),{name:'AbortError'});
  assert.equal(applied,false);
  assert.equal(await refreshMarketBatches([],async()=>{throw new Error('No request expected');},async()=>{},()=>{},new AbortController().signal),true);
});
