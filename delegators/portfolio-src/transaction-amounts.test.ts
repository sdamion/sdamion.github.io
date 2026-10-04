import assert from 'node:assert/strict';
import {transactionAmounts,lovelaceToAda,historicalAdaPrice} from './transaction-amounts.ts';
import {cexAdaTransfer,cexTimeline,cexUsdNetPosition,cexAdaNetPosition} from './cex.ts';
import {byronGroupTransactions} from './byron-exchanges.ts';
import type {Fact} from './core';

const time=Date.parse('2026-10-04T23:59:59Z')/1000;
const history={'2026-10-04':0.25,'2026-10-05':0.5};
assert.equal(historicalAdaPrice(time,history),0.25);
assert.equal(historicalAdaPrice(time+1,history),0.5);
assert.equal(lovelaceToAda('1'),0.000001);
assert.equal(transactionAmounts('-1000000',time,history,'0').usd,-0.25);
assert.equal(transactionAmounts('1000000',time,{},null).usd,null);
assert.equal(transactionAmounts(null,time,history).ada,null);
assert.equal(transactionAmounts('1000000',time,history,null).feeAda,null);
assert.equal(transactionAmounts('1000000',time,history,'0').feeAda,0);
assert.equal(transactionAmounts('1000000',time,{'2026-10-04':Infinity}).usd,null);

const entries=[{address:'exchange-a',name:'CEX'},{address:'exchange-b',name:'CEX'}];
const incoming:Fact={hash:'in',time,adaRaw:'100000000',feeRaw:'0',internal:false,wallets:['mine'],assets:{},decimals:{},swapCandidate:false,externalInputs:[{address:'exchange-a',lovelace:'80000000'},{address:'exchange-b',lovelace:'40000000'}]};
const outgoing:Fact={...incoming,hash:'out',adaRaw:'-50200000',feeRaw:'200000',externalInputs:[],externalOutputs:[{address:'exchange-a',lovelace:'50000000'}]};
const facts=[incoming,outgoing,incoming];
const chart=cexTimeline(facts,entries,history);
const byron=byronGroupTransactions(facts,entries.map(entry=>entry.address),entries);
assert.equal(chart.length,2,'shared funding and duplicate facts counted once');
for(const fact of [incoming,outgoing]){
  const transfer=cexAdaTransfer(fact,entries)!;
  const row=transactionAmounts(transfer.raw,fact.time,history,fact.feeRaw);
  const byronRow=byron.find(item=>item.hash===fact.hash)!;
  assert.deepEqual(transactionAmounts(byronRow.amountRaw,byronRow.time,history,fact.feeRaw),row);
  assert.equal(chart.find(item=>item.hash===fact.hash)!.usd,row.usd);
}
assert.equal(transactionAmounts(cexAdaTransfer(outgoing,entries)!.raw,time,history,outgoing.feeRaw).feeAda,0.2);
assert.deepEqual(cexAdaNetPosition(facts,entries,'60000000'),{receivedRaw:'100000000',sentRaw:'50000000',netRaw:'10000000'});
assert.deepEqual(cexUsdNetPosition(facts,entries,'60000000',history,0.25),{usd:2.5,missingPrices:0,boughtUsd:25,soldUsd:12.5});
assert.equal(cexUsdNetPosition(facts,entries,'60000000',{},0.25).usd,null);
assert.equal(cexAdaTransfer({...incoming,internal:true},entries),null);
console.log('PASS: common amounts across tables, Byron, chart and totals; UTC prices, fees, missing data and deduplication.');
