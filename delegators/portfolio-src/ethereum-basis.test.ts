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
console.log('Ethereum receipt basis tests passed');
