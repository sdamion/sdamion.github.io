import test from 'node:test';
import assert from 'node:assert/strict';
import {base58} from '@scure/base';
import {emptySolana,nativeWallets,solanaData,solanaTransactions,solanaTransfers,solanaTotals,validSolana,validSolanaTransaction} from './solana.ts';
const own=base58.encode(new Uint8Array(32).fill(1)),other=base58.encode(new Uint8Array(32).fill(2)),cex=base58.encode(new Uint8Array(32).fill(3)),hash=base58.encode(new Uint8Array(64).fill(4));
const wallets=[{address:own,name:'Own'},{address:other,name:'Other'}],exchanges=[{address:cex,name:'CEX'}];
const tx={hash,slot:1,time:1672963200,payer:own,feeRaw:'5000',failed:false,transfers:[{from:cex,to:own,raw:'2000000000'},{from:own,to:other,raw:'1000000000'},{from:other,to:cex,raw:'500000000'}]};
test('Solana addresses are case sensitive and caches validate native quantities',()=>{
 assert.equal(validSolana(own),true);assert.equal(validSolana('0x'+'a'.repeat(40)),false);
 assert.equal(validSolanaTransaction(tx),true);assert.equal(validSolanaTransaction({...tx,feeRaw:'-1'}),false);
 assert.equal(validSolanaTransaction({...tx,failed:true}),false);
 assert.equal(nativeWallets([{address:own,name:'Own'},{address:own,name:'Duplicate'}]).length,1);
 const invalid=solanaData({accounts:{[own]:{raw:'0',slot:1,checkpoint:hash,transactions:[{...tx,hash:'invalid'}]}}});assert.equal(Object.keys(invalid.accounts).length,0);
});
test('SOL exchange legs exclude own transfers, fees count once across wallets',()=>{
 const data={...emptySolana(),usd:100,history:{'2023-01-06':20},accounts:Object.fromEntries(wallets.map(w=>[w.address,{raw:'1000000000',slot:2,checkpoint:hash,transactions:[tx]}]))};
 assert.equal(solanaTransactions(data,wallets).length,1);
 const transfers=solanaTransfers(data,wallets,exchanges);assert.equal(transfers.length,2);
 assert.deepEqual(transfers.map(row=>[row.side,row.amount,row.usd]),[['buy',2,40],['sell',0.5,10]]);
 const totals=solanaTotals(data,wallets);assert.equal(totals.value,200);assert.equal(totals.fees,0.000005);assert.equal(totals.partial,false);
 assert.equal(solanaTransfers({...data,history:{}},wallets,exchanges)[0].usd,null);
 assert.equal(solanaTransfers({...data,accounts:{[own]:{...data.accounts[own],transactions:[{...tx,failed:true,transfers:[]}]}}},wallets,exchanges).length,0);
 assert.equal(solanaTotals(emptySolana(),wallets).value,null);assert.equal(solanaTotals(emptySolana(),wallets).fees,null);
 assert.equal(solanaTotals({...data,accounts:{[own]:data.accounts[own]}},wallets).partial,true);
});
test('Pending SOL receipts survive cache loading without publishing incomplete totals',()=>{
 const pending=solanaData({...emptySolana(),pending:[tx,tx]});
 assert.equal(pending.pending?.length,1);
 assert.equal(solanaTransactions(pending,wallets).length,0);
 assert.equal(solanaTransfers(pending,wallets,exchanges).length,0);
 assert.equal(solanaTotals(pending,wallets).fees,null);
 assert.equal(solanaData({...emptySolana(),pending:[{...tx,feeRaw:'-1'}]}).pending,undefined);
});

test('SOL source selections survive settings loading and exclude ordinary CEX totals',()=>{
 const sources=nativeWallets([{...exchanges[0],miner:true}]);
 assert.equal(sources[0].miner,true);
 const data={...emptySolana(),history:{'2023-01-06':20},accounts:{[own]:{raw:'1000000000',slot:2,checkpoint:hash,transactions:[tx]}}};
 const rows=solanaTransfers(data,wallets,sources);
 assert.equal(rows.length,1);
 assert.equal(rows[0].amount,2);
 assert.equal(rows[0].performance,false);
 assert.equal(rows.filter(row=>row.performance!==false).length,0);
 assert.equal(nativeWallets([{...exchanges[0],miner:'true'}])[0].miner,undefined);
});
