import assert from 'node:assert/strict';
import {test} from 'node:test';
import {encodeEthereumScanCheckpoint,readEthereumScanCheckpoints} from './ethereum-scan-storage.ts';
import {ethereumHistory} from './ethereum-history.ts';
import {ethereumTransactions,ethereumValue,ethereumFees,type EthereumTransaction} from './ethereum.ts';
import {readEthereumSettings} from './ethereum-storage.ts';

const address='0x'+'a'.repeat(40),swap='0x'+'b'.repeat(40),other='0x'+'c'.repeat(40);
const prefix='tdsp-member-ethereum-data:member::scan',scope=`${address}:normal:etherscan:0`;
const tx=(block:number):EthereumTransaction=>{const hash='0x'+block.toString(16).padStart(64,'0');return {id:hash+':normal',hash,kind:'normal',block,time:1700000000,from:swap,to:address,valueWei:'1',feeWei:'1',failed:false};};
test('encrypted-setting checkpoint parts restore a large range without changing completed accounts',()=>{
  const records=Array.from({length:10001},(_,i)=>tx(i+1));
  const values=encodeEthereumScanCheckpoint(prefix,scope,{startBlock:0,endBlock:10001,transactions:records});
  assert.equal(Object.keys(values).length,3);
  const restored=readEthereumScanCheckpoints(prefix,Object.keys(values),key=>values[key]??null);
  assert.deepEqual(restored.get(scope)?.get('0:10001')?.transactions,records);
  const broken={...values};delete broken[`${prefix}::${scope}::0::1`];
  assert.throws(()=>readEthereumScanCheckpoints(prefix,Object.keys(broken),key=>broken[key]??null),/incomplete/);
});
test('restart resumes durable completed ranges and fetches only the boundary and remainder',async()=>{
  const values:Record<string,string>={};
  const save=async(range:{startBlock:number;endBlock:number;transactions:EthereumTransaction[]})=>{Object.assign(values,encodeEthereumScanCheckpoint(prefix,scope,range));};
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:99},async range=>{
    if(range.startBlock>0)throw new Error('offline');
    return {transactions:[tx(range.page)],more:true};
  },new Map(),Infinity,Infinity,undefined,save),/offline/);
  const restored=readEthereumScanCheckpoints(prefix,Object.keys(values),key=>values[key]??null);
  const calls:number[]=[];
  const rows=await ethereumHistory({startBlock:0,endBlock:100},async range=>{calls.push(range.startBlock);return {transactions:[tx(10),tx(11)],more:false};},restored.get(scope));
  assert.deepEqual(calls,[10]);assert.equal(rows.length,11);
  assert.equal(restored.has(`${address}:normal:blockscout:0`),false,'provider-local trace identities never share checkpoints');
});
test('shared swap history and balances never appear in owned totals; matching transfers remain',()=>{
  const own=tx(1),unrelated={...tx(2),from:swap,to:other};
  const wallets=[{address,name:'Own'},{address:swap,name:'Service',group:'swap' as const}];
  const data={accounts:{[address]:{balanceWei:'1000000000000000000',block:2,transactions:[own]},[swap]:{balanceWei:'999000000000000000000',block:2,transactions:[own,unrelated]}},history:{},usd:1000,updated:null};
  assert.deepEqual(ethereumTransactions(data,wallets),[own]);
  assert.equal(ethereumValue(data,wallets),1000);assert.equal(ethereumFees(data,wallets),0);
});

test('an interruption before ten pages still preserves confirmed blocks without accumulating overlapping parts',async()=>{
  const values:Record<string,string>={};
  await assert.rejects(ethereumHistory({startBlock:0,endBlock:99},async({page})=>{
    if(page===3)throw new Error('offline');
    return {transactions:[tx(page*2-1),tx(page*2)],more:true};
  },new Map(),Infinity,Infinity,undefined,async range=>{Object.assign(values,encodeEthereumScanCheckpoint(prefix,scope,range));}),/offline/);
  const restored=readEthereumScanCheckpoints(prefix,Object.keys(values),key=>values[key]??null);
  assert.equal(Object.keys(values).length,2,'the growing prefix updates one header and one part');
  const calls:number[]=[];
  const rows=await ethereumHistory({startBlock:0,endBlock:99},async range=>{calls.push(range.startBlock);return {transactions:[tx(4)],more:false};},restored.get(scope));
  assert.deepEqual(calls,[4]);assert.deepEqual(rows.map(row=>row.block),[1,2,3,4]);
});

test('cache restoration does not decode shared-service history partitions',()=>{
  const key='tdsp-member-ethereum-data:member';
  const values={[key]:JSON.stringify({storageVersion:2,accounts:{[address]:{balanceWei:'1',block:2,parts:0},[swap]:{balanceWei:'999',block:2,parts:1000}},history:{},usd:1000,updated:null})};
  const reads:string[]=[];
  const data=readEthereumSettings(key,name=>{reads.push(name);return values[name]??null;},new Set([address]));
  assert.deepEqual(reads,[key]);assert.deepEqual(Object.keys(data.accounts),[address]);
});
