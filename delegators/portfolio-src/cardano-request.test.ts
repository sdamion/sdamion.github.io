import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('successful 50-transaction batches preserve all transactions with twenty requests per thousand',async()=>{
  let count=0;
  const request=createCardanoRequest(async(_,options)=>{
    count++;return Response.json(JSON.parse(String(options.body)).body._tx_hashes);
  });
  const hashes=Array.from({length:1000},(_,i)=>String(i));
  assert.deepEqual(await request('tx_info',{_tx_hashes:hashes},new AbortController().signal),hashes);
  assert.equal(count,20);
});

test('a new refresh starts at 50 after the previous refresh learned smaller batches',async()=>{
  let recovering=false;
  const sizes:number[]=[];
  const fetcher=async(_:string,options:RequestInit)=>{
    const hashes=JSON.parse(String(options.body)).body._tx_hashes;
    sizes.push(hashes.length);
    return !recovering&&hashes.length>5?new Response(null,{status:504}):Response.json(hashes);
  };
  const hashes=Array.from({length:50},(_,i)=>String(i));
  const signal=new AbortController().signal;
  const previous=createCardanoRequest(fetcher);
  assert.deepEqual(await previous('tx_info',{_tx_hashes:hashes},signal),hashes);
  recovering=true;sizes.length=0;
  assert.deepEqual(await previous('tx_info',{_tx_hashes:hashes},signal),hashes);
  assert.ok(sizes.length>1,'the current refresh retains its learned safe size');
  sizes.length=0;
  const next=createCardanoRequest(fetcher);
  assert.deepEqual(await next('tx_info',{_tx_hashes:hashes},signal),hashes);
  assert.deepEqual(sizes,[50],'a healthy new refresh uses one full batch');
});

test('wallet and purchase refreshes own their adaptive request clients',()=>{
  const wallet=readFileSync(new URL('./cardano-refresh.ts',import.meta.url),'utf8');
  const purchase=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
  for(const [source,entry] of [[wallet,'export async function refreshCardanoPortfolio('],[purchase,'async function refreshAssetPurchases(']]){
    const start=source.indexOf(entry);
    assert.ok(start>=0);
    assert.equal(source.slice(0,start).includes('const request=createCardanoRequest(portfolioFetch);'),false,'no page-scoped adaptive client');
    assert.ok(source.slice(start).includes('const request=createCardanoRequest(portfolioFetch);'));
  }
});
