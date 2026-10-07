import assert from 'node:assert/strict';
import {ethereumWallets,ethereumData,ethereumTransactions,ethereumTransfer,ethereumTransfers,ethereumValue,ethereumFees,emptyEthereum} from './ethereum.ts';
import type {EthereumTransaction} from './ethereum.ts';
import {transferComparison,nativeTransferTotals,comparisonNet} from './transfer-comparison.ts';
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
const miners=wallets.map(w=>({...w,miner:w.address===a}));
const reward=tx(6,'0x'+'d'.repeat(40),a);
assert.deepEqual(ethereumTransfer(reward,miners,exchanges),{side:'sell',amount:1,mined:true});
assert.equal(ethereumTransfer(reward,wallets,exchanges),null,'disabling Miner restores classification immediately');
assert.deepEqual(ethereumTransfer(input,miners,exchanges),{side:'buy',amount:1},'known exchange purchases stay ETH IN');
assert.equal(ethereumTransfer(internal,miners,exchanges),null,'own-wallet mining transfers never counted twice');
assert.equal(ethereumTransfer({...reward,failed:true},miners,exchanges),null);
assert.equal(ethereumTransfer({...reward,valueWei:'0'},miners,exchanges),null);
assert.deepEqual(ethereumWallets([{address:a,name:'Miner',miner:true},{address:b,name:'Regular',miner:'true'}]),[{address:a,name:'Miner',miner:true},{address:b,name:'Regular'}]);
const miningData={...data,accounts:{...data.accounts,[a]:{...data.accounts[a],transactions:[...data.accounts[a].transactions,reward]}}};
assert.equal(nativeTransferTotals(ethereumTransfers(miningData,miners,exchanges),{}, {},'USD').outFiat,2000,'mined receipts use their historical ETH price');
assert.equal(ethereumValue(data,wallets),6000);assert.equal(ethereumValue(emptyEthereum(),wallets),null);
assert.equal(ethereumFees(data,wallets),0.00063,'fees only for own senders, including failed sends, never trace fees or duplicates');
const transfers=ethereumTransfers(data,wallets,exchanges);
assert.equal(transfers.length,3);assert.equal(transfers.reduce((sum,t)=>sum+(t.side==='buy'?t.usd!:0),0),1500);
for(const [currency,factor] of [['USD',1],['EUR',0.9],['JPY',130],['ADA',2]] as const){
  assert.deepEqual(nativeTransferTotals([...transfers,transfers[0]],{'2023-01-06':0.5},{'2023-01-06':{EUR:0.9,JPY:130}},currency),
    {incoming:1.5,outgoing:1,inFiat:1500*factor,outFiat:1000*factor},'native ETH totals preserve quantities and use dated currency conversion');
}
const missingTotals=nativeTransferTotals(ethereumTransfers({...data,history:{}},wallets,exchanges),{}, {},'USD');
assert.deepEqual(missingTotals,{incoming:1.5,outgoing:1,inFiat:null,outFiat:null},'missing price does not hide known ETH quantities or become zero');
assert.deepEqual(nativeTransferTotals([],{}, {},'USD'),{incoming:0,outgoing:0,inFiat:0,outFiat:0});
assert.deepEqual(nativeTransferTotals([transfers[0],{...transfers[0],hash:'next-day',time:time+86400,usd:2000}],{},
  {'2023-01-06':{EUR:0.9},'2023-01-07':{EUR:0.8}},'EUR'),
  {incoming:2,outgoing:0,inFiat:2500,outFiat:0},'each transfer uses its own daily ETH price and FX rate');
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
const ethComparison=transferComparison([fact], [{address:'cex',name:'Bitvavo'}],{'2023-01-06':0.5},{},{},'ETH','USD',transfers,data.history).at(-1)!;
assert.deepEqual(ethComparison,{time,incoming:1.55,outgoing:1,inFiat:1550,outFiat:1000},'ETH comparison combines native ETH and transfer-day Cardano equivalents');
assert.equal(comparisonNet(ethComparison,0,0.5,{}, {},'ETH','USD',time,6000,2000).amount,2.45);
assert.equal(transferComparison([fact], [{address:'cex',name:'Bitvavo'}],{'2023-01-06':0.5},{},{},'ETH','USD',[],{}).at(-1)!.incoming,null,'missing ETH rate does not produce zero or use BTC');
assert.equal(comparisonNet(ethComparison,0,0.5,{}, {},'ETH','USD',time,6000,null).amount,null);
assert.equal(missing[0].usd,null);
assert.equal(transferComparison([fact],[{address:'cex',name:'Bitvavo'}],{'2023-01-06':0.5},{}, {},'ADA','USD',missing).at(-1)!.inFiat,null,'missing ETH rates never treated as zero');
assert.deepEqual(ethereumData(data),data);
assert.equal(Object.keys(ethereumData({...data,accounts:{[a]:{...data.accounts[a],transactions:[{...input,valueWei:'invalid'}]}}}).accounts).length,0);
console.log('PASS: Ethereum tracking, CEX classification, internal/failed transfers, gas fees, combined dated USD/EUR/JPY and missing history.');
