import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planWalletDiscovery,pruneUnusedWalletAddresses,lowActivityWalletAddresses} from './wallet-discovery.ts';
import {planRefresh} from './refresh-plan.ts';
import type {Snapshot} from './cache';
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const other='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
const wallets=[{address:stake,label:'Member'}];
test('completed wallet discovery is reused while newly added wallets are queried',()=>{
  const cache={complete:true,groups:{[stake]:['addr-one']}} as unknown as Snapshot;
  const result=planWalletDiscovery([...wallets,{address:other,label:'New'}],cache);
  assert.deepEqual(result.pending,[other]);
  assert.deepEqual(result.accounts,[{stake_address:stake,addresses:['addr-one']}]);
});
test('per-address completion preserves scanned wallets when another wallet is unfinished',()=>{
  const cache={complete:false,groups:{[stake]:['addr-one']},historyCompleteAddresses:['addr-one']} as unknown as Snapshot;
  assert.deepEqual(planWalletDiscovery(wallets,cache).pending,[]);
  assert.deepEqual(planWalletDiscovery(wallets,{...cache,historyCompleteAddresses:[]}).pending,[stake]);
  assert.deepEqual(planWalletDiscovery(wallets,null).pending,[stake]);
});
test('swap discovery is reused without adding service addresses to owned groups',()=>{
  const cache={swapGroups:{[stake]:['service']}} as unknown as Snapshot;
  assert.deepEqual(planWalletDiscovery([{...wallets[0],group:'swap'}],cache).accounts,[{stake_address:stake,addresses:['service']}]);
  assert.deepEqual(planWalletDiscovery(wallets,cache).pending,[stake]);
});

test('complete analysis removes unused linked addresses and reuses the pruned discovery',()=>{
  const cache={complete:true,groups:{[stake]:['unused','used','funded','disabled','unknown']},
    infos:['unused','used','funded','disabled'].map(address=>({address,balance:address==='funded'?'1':'0',utxo_set:[]})),
    txs:[{tx_hash:'tx'}],facts:{tx:{wallets:['used']}},excludedRefreshAddresses:['disabled']
  } as unknown as Snapshot;
  const result=pruneUnusedWalletAddresses(cache,wallets);
  assert.deepEqual(result.groups?.[stake],['used','funded','disabled','unknown']);
  assert.equal(result.infos.some(info=>info.address==='unused'),false);
  assert.deepEqual(planWalletDiscovery(wallets,result).accounts[0].addresses,result.groups?.[stake]);
  assert.equal(pruneUnusedWalletAddresses({...cache,complete:false},wallets).groups,cache.groups);
  assert.equal(pruneUnusedWalletAddresses({...cache,facts:{}},wallets).groups,cache.groups);
  assert.ok(pruneUnusedWalletAddresses(cache,[...wallets,{address:'unused',label:'Explicit'}]).groups?.[stake].includes('unused'));
});

test('empty stake groups remain cached and are not rediscovered',()=>{
  const cache={complete:true,groups:{[stake]:['unused']},infos:[{address:'unused',balance:'0'}],txs:[],facts:{}} as unknown as Snapshot;
  const result=pruneUnusedWalletAddresses(cache,wallets);
  assert.deepEqual(result.groups?.[stake],[]);
  assert.deepEqual(planWalletDiscovery(wallets,result).pending,[]);
  assert.deepEqual(cache.groups?.[stake],['unused']);
});

test('low activity is skipped repeatedly without dropping ownership or history; rescan restores requests',()=>{
  const facts=Object.fromEntries(Array.from({length:10},(_,i)=>['tx'+i,{hash:'tx'+i,wallets:i<9?['low','active']:['active']} ]));
  const cache={complete:true,groups:{[stake]:['low','active']},infos:[{address:'low',balance:'100'},{address:'active',balance:'200'}],
    txs:Object.keys(facts).map(tx_hash=>({tx_hash})),facts,historyCompleteAddresses:['low','active']} as unknown as Snapshot;
  assert.deepEqual(lowActivityWalletAddresses(cache),['low']);
  const excluded=new Set(lowActivityWalletAddresses(cache));
  const plan=planRefresh(cache,cache.groups!,excluded);
  assert.deepEqual(plan.batches.flatMap(batch=>batch.addresses),['active']);
  assert.equal(plan.owned.has('low'),true);
  assert.deepEqual(plan.txs,cache.txs);
  assert.deepEqual(plan.facts,cache.facts);
  const saved={...cache,excludedRefreshAddresses:[...excluded],historyCompleteAddresses:plan.historyCompleteAddresses};
  const repeated=planRefresh(saved,saved.groups!,excluded);
  assert.ok(repeated.historyCompleteAddresses.includes('low'));
  assert.deepEqual(lowActivityWalletAddresses({...saved,historyCompleteAddresses:repeated.historyCompleteAddresses}),['low']);
  const rescan=planRefresh(saved,saved.groups!,new Set(),true);
  assert.ok(rescan.batches.some(batch=>batch.addresses.includes('low')&&!batch.incremental));
  assert.deepEqual(lowActivityWalletAddresses({...cache,complete:false,historyCompleteAddresses:[]}),[]);
  assert.deepEqual(lowActivityWalletAddresses({...cache,facts:{}}),[]);
});
