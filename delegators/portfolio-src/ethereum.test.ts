import assert from 'node:assert/strict';
import {ethereumWallets,ethereumData,ethereumTransactions,ethereumTransfer,ethereumTransfers,ethereumValue,ethereumFees,emptyEthereum} from './ethereum.ts';
import type {EthereumTransaction} from './ethereum.ts';
import {transferComparison,comparisonNet} from './transfer-comparison.ts';
import type {Fact} from './core.ts';
const a='0x'+'a'.repeat(40),b='0x'+'b'.repeat(40),cex='0x'+'c'.repeat(40);
const wallets=[{address:a,name:'Savings'},{address:b,name:'Ledger'}],exchanges=[{address:cex,name:'Bitvavo'}];
const time=Date.parse('2023-01-06')/1000;
function tx(n:number,from:string,to:string,valueWei='1000000000000000000',kind:'normal'|'internal'='normal'):EthereumTransaction{
  const hash='0x'+String(n).padStart(64,'0');
  return {id:hash+':'+(kind==='normal'?'normal':'0_1'),hash,kind,block:100,time,from,to,valueWei,feeWei:kind==='normal'?'210000000000000':null,failed:false};
}
const input=tx(1,cex,a),output=tx(2,b,cex),internal=tx(3,a,b),failed={...tx(4,a,cex),failed:true},trace=tx(5,cex,a,'500000000000000000','internal');
const data={accounts:{[a]:{balanceWei:'2000000000000000000',block:100,transactions:[input,internal,failed,trace]},[b]:{balanceWei:'1000000000000000000',block:100,transactions:[output,internal]}},history:{'2023-01-06':1000},usd:2000,updated:null};
assert.deepEqual(ethereumWallets([{address:a.toUpperCase().replace('0X','0x'),name:' Savings '},{address:a,name:'Updated'},{address:'addr1fake',name:'No'}]),[{address:a,name:'Updated'}]);
assert.equal(ethereumTransactions(data,wallets).length,5,'shared own-wallet history counted once');
assert.equal(ethereumTransfer(internal,wallets,[...exchanges,{address:b,name:'Not a CEX'}]),null,'own-wallet transfers never become CEX');
assert.equal(ethereumTransfer(failed,wallets,exchanges),null,'failed sends are not CEX OUT');
assert.deepEqual(ethereumTransfer(input,wallets,exchanges),{side:'buy',amount:1});
assert.equal(ethereumValue(data,wallets),6000);assert.equal(ethereumValue(emptyEthereum(),wallets),null);
assert.equal(ethereumFees(data,wallets),0.00063,'fees only for own senders, including failed sends, never trace fees or duplicates');
const transfers=ethereumTransfers(data,wallets,exchanges);
assert.equal(transfers.length,3);assert.equal(transfers.reduce((sum,t)=>sum+(t.side==='buy'?t.usd!:0),0),1500);
const fact:Fact={hash:'cardano',time,adaRaw:'100000000',feeRaw:'0',internal:false,assets:{},decimals:{},wallets:[],swapCandidate:false,externalInputs:[{address:'cex',lovelace:'100000000'}],externalOutputs:[]};
for(const crypto of ['ADA','BTC'] as const){
  for(const [currency,factor] of [['USD',1],['EUR',0.9],['JPY',130]] as const){
    const last=transferComparison([fact,fact],[{address:'cex',name:'Bitvavo'}],{'2023-01-06':0.5},{'2023-01-06':10000},{'2023-01-06':{EUR:0.9,JPY:130}},crypto,currency,[...transfers,transfers[0]]).at(-1)!;
    assert.equal(last.inFiat,1550*factor);assert.equal(last.outFiat,1000*factor);
    assert.ok(Math.abs(last.incoming!-(crypto==='ADA'?3100:0.155))<1e-12,'ETH converted at its daily price, never added as a coin count');
    const net=comparisonNet(last,0,0.5,{'2023-01-06':10000},{'2023-01-06':{EUR:0.9,JPY:130}},crypto,currency,time,6000);
    assert.equal(net.fiat,5450*factor,'combined OUT + current assets - IN');
  }
}
const missing=ethereumTransfers({...data,history:{}},wallets,exchanges);
assert.equal(missing[0].usd,null);
assert.equal(transferComparison([fact],[{address:'cex',name:'Bitvavo'}],{'2023-01-06':0.5},{}, {},'ADA','USD',missing).at(-1)!.inFiat,null,'missing ETH rates never treated as zero');
assert.deepEqual(ethereumData(data),data);
assert.equal(Object.keys(ethereumData({...data,accounts:{[a]:{...data.accounts[a],transactions:[{...input,valueWei:'invalid'}]}}}).accounts).length,0);
console.log('PASS: Ethereum tracking, CEX classification, internal/failed transfers, gas fees, combined dated USD/EUR/JPY and missing history.');
