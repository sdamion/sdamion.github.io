import assert from 'node:assert/strict';
import {ethereumReceiptBasis} from './ethereum-basis.ts';
import {receiptBasis} from './receipt-basis.ts';
import type {EthereumData,EthereumTransaction} from './ethereum.ts';
const own='0x'+'a'.repeat(40),cex='0x'+'b'.repeat(40),pool='0x'+'c'.repeat(40);
const wallets=[{address:own,name:'Wallet'}],exchanges=[{address:cex,name:'Exchange'},{address:pool,name:'Mining pool',miner:true}];
const unit=10n**18n,time=Date.parse('2023-01-06')/1000;
function tx(n:number,from:string,to:string,amount:bigint,fee=0n):EthereumTransaction{
  const hash='0x'+String(n).padStart(64,'0');
  return {id:hash+':normal',hash,kind:'normal',block:n,time,from,to,valueWei:String(amount),feeWei:String(fee),failed:false};
}
function data(transactions:EthereumTransaction[],balance:bigint,history={'2023-01-06':1000}):EthereumData{
  return {accounts:{[own]:{balanceWei:String(balance),block:100,transactions}},history,usd:2000,updated:null};
}
const buy=tx(1,cex,own,unit),mine=tx(2,pool,own,unit);
assert.deepEqual(ethereumReceiptBasis(data([buy,mine],2n*unit),wallets,exchanges),{reconciled:true,usd:1000,average:500});
const sell=tx(3,own,cex,unit,unit/100n);
const basis=ethereumReceiptBasis(data([buy,mine,sell],99n*unit/100n),wallets,exchanges);
assert.equal(basis.average,500,'sends and gas remove proportional cost');
assert.equal(basis.usd,495);
assert.equal(ethereumReceiptBasis(data([mine],unit,{}),wallets,exchanges).average,0,'mining does not require historical prices');
assert.equal(ethereumReceiptBasis(data([buy,mine],2n*unit,{}),wallets,exchanges).average,null,'missing purchase price is not zero');
assert.equal(ethereumReceiptBasis(data([buy,mine],3n*unit),wallets,exchanges).reconciled,false);
assert.equal(ethereumReceiptBasis(data([buy,mine],2n*unit),wallets,[exchanges[0]]).average,null,'unclassified external receipts have unknown cost');
assert.equal(ethereumReceiptBasis({...data([],0n),accounts:{}},wallets,exchanges).average,null);
assert.equal(ethereumReceiptBasis(data([buy,tx(2,own,own,unit,unit/100n)],99n*unit/100n),wallets,exchanges).average,1000,'self-transfers only spend gas');
assert.equal(receiptBasis([{receivedRaw:1n,spentRaw:0n,costUsd:NaN}],1n,0).average,null);
assert.equal(receiptBasis([{receivedRaw:0n,spentRaw:1n,costUsd:0}],0n,0).reconciled,false);
const sameBuy={...tx(99,cex,own,2n*unit),block:100,transactionIndex:1};
const sameSend={...tx(1,own,cex,unit),block:100,transactionIndex:2};
assert.deepEqual(ethereumReceiptBasis(data([sameBuy,sameSend],unit),wallets,exchanges),{reconciled:true,usd:1000,average:1000},'same-block execution follows indexes, never hashes');
assert.equal(ethereumReceiptBasis(data([sameSend,sameBuy],unit),wallets,exchanges).average,1000,'explicit execution indexes override array order');
const sameMine={...tx(98,pool,own,unit),block:100,transactionIndex:2};
const afterMine={...sameSend,transactionIndex:3};
assert.equal(ethereumReceiptBasis(data([afterMine,sameBuy,sameMine],2n*unit),wallets,exchanges).usd,2000*2/3,'mining dilutes average before the later sale removes proportional cost');
const {transactionIndex:buyIndex,...legacyBuy}=sameBuy,{transactionIndex:sendIndex,...legacySend}=sameSend;
assert.equal(ethereumReceiptBasis(data([legacyBuy,legacySend],unit),wallets,exchanges).average,1000,'legacy ascending provider pages retain execution order');
const second='0x'+'d'.repeat(40),twoWallets=[...wallets,{address:second,name:'Second wallet'}];
const split={...data([sameBuy],unit),accounts:{[own]:{balanceWei:String(unit),block:100,transactions:[sameBuy]},[second]:{balanceWei:'0',block:100,transactions:[sameSend]}}};
assert.equal(ethereumReceiptBasis(split,twoWallets,exchanges).average,1000,'indexes join transactions across wallet caches');
assert.equal(ethereumReceiptBasis({...split,accounts:{[own]:{...split.accounts[own],transactions:[legacyBuy]},[second]:{...split.accounts[second],transactions:[legacySend]}}},twoWallets,exchanges).average,null,'ambiguous legacy order is not guessed');
const traceBuy={...sameBuy,kind:'internal' as const,id:sameBuy.hash+':0_2',feeWei:null,traceIndex:'0_2'};
const traceSend={...sameSend,kind:'internal' as const,hash:sameBuy.hash,id:sameBuy.hash+':0_10',transactionIndex:1,feeWei:null,traceIndex:'0_10'};
assert.equal(ethereumReceiptBasis(data([traceSend,traceBuy],unit),wallets,exchanges).average,1000,'numeric trace positions survive canonical IDs');
console.log('Ethereum receipt basis tests passed');
