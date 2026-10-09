import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ethereumHistory} from './ethereum-history.ts';
import type {EthereumHistoryCheckpoints} from './ethereum-history.ts';
import type {EthereumTransaction} from './ethereum.ts';
const address='0x'+'a'.repeat(40),other='0x'+'b'.repeat(40);
const tx=(block:number):EthereumTransaction=>({id:'0x'+'1'.repeat(64)+':normal',hash:'0x'+'1'.repeat(64),kind:'normal',block,time:1700000000,from:address,to:other,valueWei:'1',feeWei:'1',failed:false});
const windowError=()=>Object.assign(new Error('window'),{code:'history_window_limit'});
test('splits rejected windows without gaps and discards incomplete parent pages',async()=>{
  const calls:object[]=[];
  const rows=await ethereumHistory({startBlock:0,endBlock:99},async range=>{
    calls.push(range);
    if(range.startBlock===0&&range.endBlock===99){if(range.page===1)return {transactions:[tx(10)],more:true};throw windowError();}
    return {transactions:range.startBlock===50?[tx(60)]:[],more:false};
  });
  assert.deepEqual(calls,[{startBlock:0,endBlock:99,page:1},{startBlock:0,endBlock:99,page:2},{startBlock:0,endBlock:49,page:1},{startBlock:50,endBlock:99,page:1}]);
  assert.deepEqual(rows,[tx(60)]);
});
test('does not return partial histories if a child fails or a single block is too dense',async()=>{
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:99},async range=>{
    if(range.endBlock===99&&range.startBlock===0)throw windowError();
    if(range.startBlock===0)return {transactions:[tx(10)],more:false};
    throw new Error('offline');
  }),/offline/);
  let calls=0;
  await assert.rejects(ethereumHistory({startBlock:3,endBlock:3},async()=>{calls++;throw windowError();}),/window/);
  assert.equal(calls,1);
});
test('unknown failures do not cause splitting and malformed ranges fail closed',async()=>{
  let calls=0;
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:99},async()=>{calls++;throw new Error('key rejected');}),/key rejected/);
  assert.equal(calls,1);
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:99},async()=>({transactions:[tx(100)],more:false})),/Invalid Ethereum history/);
});
test('ordinary pagination stays in the incremental range and deduplicates identities',async()=>{
  const calls:object[]=[];
  const rows=await ethereumHistory({startBlock:60,endBlock:99},async range=>{calls.push(range);return {transactions:[tx(60)],more:range.page===1};});
  assert.equal(rows.length,1);
  assert.deepEqual(calls,[{startBlock:60,endBlock:99,page:1},{startBlock:60,endBlock:99,page:2}]);
});
test('advances before page eleven and rechecks the full boundary block',async()=>{
  const calls:{startBlock:number;endBlock:number;page:number}[]=[];
  const make=(block:number,id:string)=>({...tx(block),id:'0x'+id.repeat(64)+':normal',hash:'0x'+id.repeat(64)});
  const rows=await ethereumHistory({startBlock:0,endBlock:99},async range=>{
    calls.push(range);
    if(range.startBlock===0)return {transactions:[make(range.page,range.page<10?'1':'2')],more:true};
    assert.equal(range.startBlock,10);
    return {transactions:[make(10,'2'),make(10,'3'),make(15,'4')],more:false};
  });
  assert.ok(!calls.some(range=>range.page>10));
  assert.deepEqual(calls.at(-1),{startBlock:10,endBlock:99,page:1});
  assert.equal(rows.length,4);
  assert.deepEqual(rows.filter(row=>row.block===10).map(row=>row.id),[make(10,'2').id,make(10,'3').id]);
});

test('large provider window trees continue beyond the former 300-request cutoff',async()=>{
  let calls=0;
  const rows=await ethereumHistory({startBlock:0,endBlock:255},async range=>{
    calls++;
    if(range.startBlock!==range.endBlock)throw windowError();
    return {transactions:[],more:false};
  });
  assert.deepEqual(rows,[]);assert.equal(calls,511);
});

test('interrupted split scans reuse only fully completed windows on the next attempt',async()=>{
  const checkpoints:EthereumHistoryCheckpoints=new Map();let failed=true;const calls:object[]=[];
  const request=async(range:{startBlock:number;endBlock:number;page:number})=>{
    calls.push(range);
    if(range.startBlock===0&&range.endBlock===99)throw windowError();
    if(range.startBlock===50&&failed)throw new Error('temporary outage');
    const hash='0x'+(range.startBlock===0?'1':'2').repeat(64);
    return {transactions:[{...tx(range.startBlock+1),hash,id:hash+':normal'}],more:false};
  };
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:99},request,checkpoints),/temporary outage/);
  assert.equal(checkpoints.size,1);failed=false;calls.length=0;
  const rows=await ethereumHistory({startBlock:0,endBlock:99},request,checkpoints);
  assert.deepEqual(calls,[{startBlock:50,endBlock:99,page:1}]);
  assert.deepEqual(rows.map(row=>row.block),[1,51],'both completed and resumed rows survive');
});

test('page-window boundaries survive interruptions without skipping equal-block rows',async()=>{
  const checkpoints:EthereumHistoryCheckpoints=new Map();let failed=true;const starts:number[]=[];
  const request=async(range:{startBlock:number;endBlock:number;page:number})=>{
    starts.push(range.startBlock);
    if(range.startBlock===0)return {transactions:[tx(range.page)],more:true};
    if(failed)throw new Error('temporary outage');
    return {transactions:[tx(10)],more:false};
  };
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:99},request,checkpoints),/temporary outage/);
  failed=false;starts.length=0;
  await ethereumHistory({startBlock:0,endBlock:99},request,checkpoints);
  assert.deepEqual(starts,[10],'completed prefix is reused while boundary block is fetched again');
});

test('pathological provider windows still stop at a bounded request budget',async()=>{
  let calls=0;
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:4095},async range=>{
    calls++;if(range.startBlock!==range.endBlock)throw windowError();
    return {transactions:[],more:false};
  },new Map(),2000),error=>(error as {code?:string}).code==='history_scan_budget');
  assert.equal(calls,2000);
});

test('all member scans can pass the former per-kind cutoff',async()=>{
  let calls=0;
  const request=async(range:{startBlock:number;endBlock:number;page:number})=>{
    calls++;
    if(range.startBlock!==range.endBlock)throw windowError();
    return {transactions:[],more:false};
  };
  assert.deepEqual(await ethereumHistory({startBlock:0,endBlock:2047},request),[]);
  assert.equal(calls,4095);
  let remaining=3;
  const limited=async()=>{
    if(remaining--<=0)throw Object.assign(new Error('shared budget exhausted'),{code:'history_scan_budget'});
    const hash='0x'+(remaining+1).toString(16).repeat(64);
    return {transactions:[{...tx(0),hash,id:hash+':normal'}],more:true};
  };
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:0},limited,new Map(),Infinity),/shared budget exhausted/);
});

test('single-block histories can exceed 100 pages but repeated pages cannot loop forever',async()=>{
  let calls=0;
  const rows=await ethereumHistory({startBlock:0,endBlock:0},async({page})=>{
    calls++;const hash='0x'+page.toString(16).padStart(64,'0');
    return {transactions:[{...tx(0),hash,id:hash+':normal'}],more:page<101};
  });
  assert.equal(calls,101);assert.equal(rows.length,101);
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:0},async()=>({transactions:[tx(0)],more:true})),/Invalid Ethereum history/);
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:0},async()=>({transactions:[],more:true})),/Invalid Ethereum history/);
});
