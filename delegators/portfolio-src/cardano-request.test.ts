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
