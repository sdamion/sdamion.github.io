import assert from 'node:assert/strict';
import {transferComparison,comparisonNet,fiatRate,transferFiatValue,comparisonResultLabel} from './transfer-comparison.ts';
import type {Fact} from './core.ts';
const time=Date.parse('2023-01-06')/1000;
assert.equal(comparisonResultLabel(10),'{crypto} comparison gain');
assert.equal(comparisonResultLabel(-10),'{crypto} comparison loss');
assert.equal(comparisonResultLabel(0),'{crypto} comparison gain');
assert.equal(comparisonResultLabel(null),'{crypto} comparison gain/loss');
const entries=[{address:'exchange',name:'Exchange'}];
const fact=(hash:string,side:'in'|'out',offset=0):Fact=>({hash,time:time+offset,adaRaw:side==='in'?'100000000':'-100000000',feeRaw:'0',internal:false,assets:{},decimals:{},wallets:[],swapCandidate:false,externalInputs:side==='in'?[{address:'exchange',lovelace:'100000000'}]:[],externalOutputs:side==='out'?[{address:'exchange',lovelace:'100000000'}]:[]});
const input=fact('a','in'),output=fact('b','out',86400);
const ada={'2023-01-06':0.5,'2023-01-07':1};
const btc={'2023-01-06':10000,'2023-01-07':20000};
const fx={'2023-01-06':{EUR:0.9,JPY:130}};
const points=transferComparison([input,output,input],entries,ada,btc,fx,'BTC','EUR');
assert.equal(points.length,2,'duplicate transaction counted once');
assert.deepEqual(points.at(-1),{time:time+86400,incoming:0.005,outgoing:0.005,inFiat:45,outFiat:90});
assert.equal(fiatRate(time+86400,'EUR',fx),0.9,'weekend uses prior business day');
assert.equal(fiatRate(time+7*86400,'EUR',fx),null,'stale FX not reused');
assert.equal(fiatRate(time,'USD',{}),1);
const net=comparisonNet(points.at(-1),50,1,btc,fx,'BTC','EUR',time+86400);
assert.ok(Math.abs(net.amount!-0.0025)<1e-12);assert.equal(net.fiat,90);
const assets=comparisonNet({time,incoming:100,outgoing:20,inFiat:50,outFiat:10},30,0.5,btc,fx,'ADA','USD',time,25);
assert.deepEqual(assets,{amount:-30,fiat:-15},'OUT plus current ADA and non-ADA asset value minus IN, without purchase costs');
assert.deepEqual(comparisonNet(undefined,100,1,btc,fx,'ADA','EUR',time,100),{amount:100,fiat:90},'empty transfer history still includes the current portfolio value');
assert.deepEqual(comparisonNet({time,incoming:100,outgoing:0,inFiat:100,outFiat:0},99,1,{}, {},'ADA','USD',time,99),{amount:-1,fiat:-1},'a fee already deducted from the wallet balance is counted once');
const yen=transferComparison([input,output],entries,ada,btc,fx,'ADA','JPY').at(-1)!;
assert.equal(yen.incoming,100);assert.equal(yen.outgoing,100);
assert.equal(yen.inFiat,6500);assert.equal(yen.outFiat,13000);
const missing=transferComparison([input,output],entries,ada,{'2023-01-06':10000},fx,'BTC','USD').at(-1)!;
assert.equal(missing.outgoing,null,'missing price is not zero');assert.equal(missing.incoming,0.005);
assert.equal(missing.outFiat,null,'no currency amount when the selected crypto amount cannot be priced');
assert.equal(transferFiatValue(0.005,10000,0.9),45,'selected crypto quantity times same-day crypto and FX price');
const sameDay=fact('c','in',60),nextDay=fact('d','in',86400);
const variedFx={'2023-01-06':{EUR:0.9,JPY:130},'2023-01-07':{EUR:0.8,JPY:140}};
for(const crypto of ['ADA','BTC'] as const){
  for(const [currency,expected] of [['USD',200],['EUR',170],['JPY',27000]] as const){
    const total=transferComparison([input,sameDay,nextDay],entries,ada,btc,variedFx,crypto,currency).at(-1)!;
    assert.equal(total.inFiat,expected,`${crypto}/${currency}: aggregate each transfer at its own day's price`);
  }
}
assert.equal(transferComparison([input],entries,ada,btc,{},'ADA','EUR')[0].inFiat,null);
assert.equal(transferComparison([input],entries,{},btc,fx,'BTC','USD')[0].incoming,null);
const adaDisplay=transferComparison([input,output],entries,ada,btc,fx,'BTC','ADA').at(-1)!;
assert.equal(adaDisplay.inFiat,100,'BTC comparison follows an ADA display selection using transfer-day prices');
assert.equal(adaDisplay.outFiat,100);
assert.equal(comparisonNet(adaDisplay,50,1,btc,fx,'BTC','ADA',time+86400,50).fiat,50);
console.log('PASS: crypto/fiat selection, dated prices, weekend FX, deduplication, net balances and missing rates.');
