import assert from 'node:assert/strict';
import {encodeEthereumSettings,readEthereumSettings} from './ethereum-storage.ts';
import {emptyEthereum,type EthereumTransaction} from './ethereum.ts';
import {portfolioTransactionCounts} from './transaction-counts.ts';
import {prepareCheckpoint,restoreCheckpoint} from './vault-checkpoint.ts';

const address='0x'+'1'.repeat(40),key='tdsp-member-ethereum-data:member';
const transactions:EthereumTransaction[]=Array.from({length:25001},(_,index)=>{
  const hash='0x'+index.toString(16).padStart(64,'0');
  return {id:hash+':normal',hash,kind:'normal',block:index,time:1700000000+index,from:address,to:address,valueWei:'1',feeWei:'1',failed:false};
});
const data={...emptyEthereum(),accounts:{[address]:{balanceWei:'1',block:25001,transactions}}};
const settings=encodeEthereumSettings(key,data);
assert.equal(Object.keys(settings).length,4);
assert.ok(!settings[key].includes(transactions[0].hash),'index contains no transaction history');
assert.deepEqual(readEthereumSettings(key,name=>settings[name]??null),readEthereumSettings(key,()=>JSON.stringify(data)),'partitioned and legacy caches have identical normalized data');
settings['tdsp-member-ethereum-wallets:member']=JSON.stringify([{address,name:'Test'}]);
assert.equal(portfolioTransactionCounts({settings,snapshot:null},'member').total,25001);
const encryptionKey=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const checkpoint=await prepareCheckpoint({version:1,settings,snapshot:null},encryptionKey,stake,null);
const restored=await restoreCheckpoint(checkpoint.index,encryptionKey,stake,async ids=>checkpoint.chunks.filter(row=>ids.includes(row.id)));
assert.equal(readEthereumSettings(key,name=>restored.settings[name]??null).accounts[address].transactions.length,25001,'all partitions survive encrypted remote checkpoints');
delete settings[key+'::'+address+':1'];
assert.throws(()=>readEthereumSettings(key,name=>settings[name]??null),/incomplete/);
assert.equal(portfolioTransactionCounts({settings,snapshot:null},'member').saved,0);
