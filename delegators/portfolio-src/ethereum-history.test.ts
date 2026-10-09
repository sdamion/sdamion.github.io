import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ethereumHistory} from './ethereum-history.ts';
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
