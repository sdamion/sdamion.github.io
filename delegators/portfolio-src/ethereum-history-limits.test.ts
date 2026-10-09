import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ethereumHistory} from './ethereum-history.ts';
import {ethereumData,type EthereumTransaction} from './ethereum.ts';
import {portfolioTransactionCounts} from './transaction-counts.ts';

test('all member history above 100,000 rows survives pagination and cache restore',async()=>{
  const address='0x'+'a'.repeat(40),other='0x'+'b'.repeat(40);
  const transactions:EthereumTransaction[]=Array.from({length:100001},(_,block)=>{
    const hash='0x'+(block+1).toString(16).padStart(64,'0');
    return {id:hash+':normal',hash,kind:'normal',block,time:1700000000,from:address,to:other,valueWei:'1',feeWei:'1',failed:false};
  });
  const request=async(range:{startBlock:number;endBlock:number;page:number})=>{
    const start=range.startBlock+(range.page-1)*1000;
    const end=Math.min(start+1000,range.endBlock+1);
    return {transactions:transactions.slice(start,end),more:end<=range.endBlock};
  };
  const range={startBlock:0,endBlock:100000};
  await assert.rejects(ethereumHistory(range,request,new Map(),Infinity,100000),/history is too large/);
  const rows=await ethereumHistory(range,request);
  assert.equal(rows.length,100001);
  assert.equal(new Set(rows.map(row=>row.id)).size,100001);
  const data={accounts:{[address]:{balanceWei:'1',block:100000,transactions:rows}},history:{},usd:null,updated:null};
  assert.equal(Object.keys(ethereumData(data,100000).accounts).length,0,'explicit count limit remains enforceable');
  assert.equal(ethereumData(data).accounts[address].transactions.length,100001,'all members retain the complete history');
  const counts=portfolioTransactionCounts({snapshot:null,settings:{
    'tdsp-member-ethereum-data:member':JSON.stringify(data),
    'tdsp-member-ethereum-wallets:member':JSON.stringify([{address,name:'My wallet'}])
  }},'member');
  assert.equal(counts.saved,100001,'saved-data progress includes the complete large wallet');
  assert.equal(counts.total,100001);
  assert.equal(Object.keys(ethereumData({...data,accounts:{[address]:{...data.accounts[address],transactions:[{...rows[0],valueWei:'invalid'}]}}},Infinity).accounts).length,0,'admin mode still rejects invalid transactions');
});
