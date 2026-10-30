import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCardanoRequest} from './cardano-request.ts';
const timeout=()=>Object.assign(new Error('timeout'),{name:'PortfolioTimeoutError'});
test('browser timeout splits tx batches sequentially without duplicate results',async()=>{
  const calls:string[][]=[];
  const request=createCardanoRequest(async(_,options)=>{
    const hashes=JSON.parse(String(options.body)).body._tx_hashes;
    calls.push(hashes);
    if(hashes.length>1)throw timeout();
    return Response.json(hashes);
  },async()=>{});
  assert.deepEqual(await request('tx_info',{_tx_hashes:['a','b','c']},new AbortController().signal),['a','b','c']);
  assert.deepEqual(calls,[['a','b','c'],['a','b'],['a'],['b'],['c']]);
});
test('gateway timeout splits address info batches and preserves every response row',async()=>{
  const calls:string[][]=[];
  const request=createCardanoRequest(async(_,options)=>{
    const addresses=JSON.parse(String(options.body)).body._addresses;
    calls.push(addresses);
    return addresses.length>2?new Response(null,{status:504}):Response.json(addresses.map((address:string)=>({address})));
  },async()=>{});
  const addresses=['a','b','c','d','e'];
  assert.deepEqual(await request('address_info',{_addresses:addresses},new AbortController().signal),addresses.map(address=>({address})));
  assert.deepEqual(calls,[addresses,['a','b','c'],['a','b'],['c'],['d','e']]);
});
test('terminal timeout includes the endpoint and page after bounded retries',async()=>{
  let calls=0;
  const request=createCardanoRequest(async()=>{calls++;throw timeout();},async()=>{});
  await assert.rejects(request('address_txs',{_addresses:['private']},new AbortController().signal,'0-999'),/\/address_txs \(1 wallet addresses, rows 0-999\) timed out.*3 attempt/);
  assert.equal(calls,3);
});
test('user cancellation never retries or splits',async()=>{
  const control=new AbortController();let calls=0;
  const request=createCardanoRequest(async()=>{calls++;control.abort();throw timeout();},async()=>{});
  await assert.rejects(request('tx_info',{_tx_hashes:['a','b']},control.signal));
  assert.equal(calls,1);
});

test('learned smaller tx batches avoid repeating oversized provider requests',async()=>{
  const sizes:number[]=[];
  const request=createCardanoRequest(async(_,options)=>{
    const hashes=JSON.parse(String(options.body)).body._tx_hashes;
    sizes.push(hashes.length);
    return hashes.length>5?new Response(null,{status:504}):Response.json(hashes);
  },async()=>{});
  const hashes=Array.from({length:25},(_,i)=>String(i));
  assert.deepEqual(await request('tx_info',{_tx_hashes:hashes},new AbortController().signal),hashes);
  const first=sizes.length;
  assert.deepEqual(await request('tx_info',{_tx_hashes:hashes},new AbortController().signal),hashes);
  assert.ok(sizes.slice(first).every(size=>size<=5));
});

test('successful 25-transaction batches use five times fewer requests than five-transaction batches',async()=>{
  let count=0;
  const request=createCardanoRequest(async(_,options)=>{
    count++;return Response.json(JSON.parse(String(options.body)).body._tx_hashes);
  });
  const hashes=Array.from({length:1000},(_,i)=>String(i));
  assert.deepEqual(await request('tx_info',{_tx_hashes:hashes},new AbortController().signal),hashes);
  assert.equal(count,40);
});
