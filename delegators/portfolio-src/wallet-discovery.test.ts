import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planWalletDiscovery} from './wallet-discovery.ts';
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
