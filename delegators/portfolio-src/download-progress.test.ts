import assert from 'node:assert/strict';
import {downloadProgressValues} from './download-progress.ts';
import {ethereumHistory} from './ethereum-history.ts';
import type {EthereumTransaction} from './ethereum.ts';

assert.deepEqual(downloadProgressValues({downloaded:12500,total:null}),{done:'12,500',total:'?'});
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
