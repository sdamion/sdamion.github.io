import assert from 'node:assert/strict';
import {cachedTransactionProgress,combinedTransactionProgress,createTransactionProgress,transactionProgress,downloadProgressValues} from './download-progress.ts';
import {ethereumHistory} from './ethereum-history.ts';
import type {EthereumTransaction} from './ethereum.ts';

assert.deepEqual(downloadProgressValues({downloaded:12500,total:null}),{done:'12,500',total:'12,500'});
assert.deepEqual(downloadProgressValues({downloaded:0,total:null}),{done:'0',total:'?'});
assert.deepEqual(downloadProgressValues({downloaded:266,total:null}),{done:'266',total:'266'},'ETH keeps its saved baseline during discovery');
assert.deepEqual(downloadProgressValues({downloaded:12500,total:12500}),{done:'12,500',total:'12,500'});
const address='0x'+'1'.repeat(40),hash='0x'+'a'.repeat(64);
const tx:EthereumTransaction={id:hash+':normal',hash,kind:'normal',block:1,time:1700000000,from:address,to:address,valueWei:'1',feeWei:'1',failed:false};
const ids=new Set<string>();
const completed=new Map();
const count=(rows:EthereumTransaction[])=>{for(const row of rows)ids.add(row.id);};
await ethereumHistory({startBlock:0,endBlock:2},async range=>({transactions:[tx],more:range.page===1}),completed,Infinity,Infinity,count);
assert.equal(ids.size,1,'overlapping pages are not counted twice');
ids.clear();
await ethereumHistory({startBlock:0,endBlock:2},async()=>{throw new Error('must reuse checkpoint');},completed,Infinity,Infinity,count);
assert.equal(ids.size,1,'resumed completed ranges contribute to download counts');

for(const chain of ['ADA','ETH','SOL']){
  const cached=[{id:'a'},{id:'b'},{id:'a'}];
  assert.deepEqual(cachedTransactionProgress(cached,row=>row.id),{downloaded:2,total:2},`${chain} displays its saved total before requesting new history`);
  const progress=createTransactionProgress(cached,row=>row.id);
  assert.deepEqual(progress.snapshot(),{downloaded:2,total:null},`${chain} restores unique cached receipts before making requests`);
  assert.deepEqual(progress.add([{id:'b'},{id:'c'}]),{downloaded:3,total:null},`${chain} merges overlapping pages`);
  const resumed=createTransactionProgress([{id:'a'},{id:'b'},{id:'c'}],row=>row.id);
  assert.deepEqual(resumed.snapshot(),progress.snapshot(),`${chain} preserves durable counts after an interruption`);
  assert.deepEqual(resumed.complete([{id:'a'},{id:'c'}]),{downloaded:2,total:2},`${chain} replaces stale or reorganised rows on completion`);
  assert.deepEqual(transactionProgress(cached,row=>row.id,3),{downloaded:2,total:3},`${chain} separates downloaded receipts from a known discovered total`);
}
assert.deepEqual(transactionProgress([],String,null),{downloaded:0,total:null});
assert.deepEqual(cachedTransactionProgress(Array.from({length:266},(_,id)=>({id:String(id)})),row=>row.id),{downloaded:266,total:266});
assert.deepEqual(combinedTransactionProgress([{downloaded:20,total:20},{downloaded:3,total:null},{downloaded:5,total:5}]),{downloaded:28,total:null},'a partial chain never displays a fabricated complete percentage');
assert.deepEqual(combinedTransactionProgress([{downloaded:20,total:20},{downloaded:3,total:3},{downloaded:5,total:5}]),{downloaded:28,total:28});
