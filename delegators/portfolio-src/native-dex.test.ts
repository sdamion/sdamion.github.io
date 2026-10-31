import {test} from 'node:test';
import assert from 'node:assert/strict';
import {base58} from '@scure/base';
import {ethereumWallets,ethereumTransfer,ethereumValue,emptyEthereum,type EthereumTransaction} from './ethereum.ts';
import {nativeWallets,solanaTransfers,solanaTotals,emptySolana,type SolanaTransaction} from './solana.ts';

test('Ethereum DEX settings survive normalization and match native ETH in both directions',()=>{
  const own='0x'+'1'.repeat(40),dex='0x'+'2'.repeat(40);
  const entries=ethereumWallets(JSON.parse(JSON.stringify([{address:dex.toUpperCase().replace('0X','0x'),name:'DEX router',dex:true}])));
  assert.deepEqual(entries,[{address:dex,name:'DEX router',dex:true}]);
  const wallets=[{address:own,name:'Owned'}];
  const tx:EthereumTransaction={id:'0x'+'a'.repeat(64)+':normal',hash:'0x'+'a'.repeat(64),kind:'normal',block:1,time:1700000000,from:dex,to:own,valueWei:'1000000000000000000',feeWei:'100',failed:false};
  assert.deepEqual(ethereumTransfer(tx,wallets,entries),{side:'buy',amount:1});
  assert.deepEqual(ethereumTransfer({...tx,from:own,to:dex},wallets,entries),{side:'sell',amount:1});
  assert.equal(ethereumTransfer({...tx,failed:true},wallets,entries),null);
  assert.equal(ethereumTransfer({...tx,from:own,to:own},wallets,entries),null);
  const data={...emptyEthereum(),usd:2000,accounts:{[own]:{balanceWei:'1000000000000000000',block:1,transactions:[]},[dex]:{balanceWei:'999000000000000000000',block:1,transactions:[]}}};
  assert.equal(ethereumValue(data,wallets),2000,'shared router funds are not owned holdings');
});

test('Solana DEX settings preserve base58 case, native SOL direction and owned-only totals',()=>{
  const own=base58.encode(new Uint8Array(32).fill(1)),dex=base58.encode(new Uint8Array(32).fill(2));
  const entries=nativeWallets(JSON.parse(JSON.stringify([{address:dex,name:'SOL DEX',dex:true}])));
  assert.deepEqual(entries,[{address:dex,name:'SOL DEX',dex:true}]);
  const wallets=[{address:own,name:'Owned'}];
  const tx:SolanaTransaction={hash:base58.encode(new Uint8Array(64).fill(3)),slot:1,time:1700000000,payer:dex,feeRaw:'5000',failed:false,transfers:[{from:dex,to:own,raw:'1000000000'}]};
  const day=new Date(tx.time*1000).toISOString().slice(0,10);
  const data={...emptySolana(),usd:100,history:{[day]:100},accounts:{[own]:{raw:'1000000000',slot:1,checkpoint:null,transactions:[tx]},[dex]:{raw:'999000000000',slot:1,checkpoint:null,transactions:[]}}};
  assert.equal(solanaTransfers(data,wallets,entries)[0].side,'buy');
  const outgoing={...tx,payer:own,transfers:[{from:own,to:dex,raw:'1000000000'}]};
  assert.equal(solanaTransfers({...data,accounts:{[own]:{...data.accounts[own],transactions:[outgoing]}}},wallets,entries)[0].side,'sell');
  assert.equal(solanaTotals(data,wallets).value,100,'shared DEX balance is not owned');
  assert.deepEqual(solanaTransfers({...data,accounts:{[own]:{...data.accounts[own],transactions:[{...tx,failed:true,transfers:[]}]}}},wallets,entries),[]);
});
