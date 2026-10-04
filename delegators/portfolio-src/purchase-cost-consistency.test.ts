import assert from 'node:assert/strict';
import {remainingBasis} from './core.ts';
import type {Fact,Acquisitions} from './core.ts';
import {assetTransactions} from './asset-transactions.ts';
import {holdingDecimals,holdingValue} from './valuation.ts';
import {averageBuy} from './average-buy.ts';

const time=Date.parse('2022-05-31T12:00:00Z')/1000;
const history={'2022-05-31':0.6}; // Fixture rate, not a market quote.
for(const source of ['linked-purchase','linked-mint','marketplace','allocated-bundle','confirmed','mint'] as const){
  const id=`asset-${source}`;
  const f:Fact={hash:source,time:time+86400,adaRaw:'0',assets:{[id]:'2'},decimals:{},feeRaw:null,internal:false,wallets:[],swapCandidate:true};
  const acquisitions:Acquisitions={[f.hash]:{[id]:{raw:'2',ada:1000,time,paymentHash:'payment',source}}};
  const basis=remainingBasis([f],history,acquisitions)[id];
  const receipt=assetTransactions(id,[f],acquisitions,history)[0];
  assert.equal(receipt.costUsd,600);
  assert.equal(basis.usd,receipt.costUsd);
  const holding=holdingValue('2',holdingDecimals({token_id:id,is_nft:true},undefined),null,null,basis);
  assert.equal(averageBuy(holding.cost,holding.qty),300);
  assert.equal(remainingBasis([f],{},acquisitions)[id].usd,null);
  assert.equal(assetTransactions(id,[f],acquisitions,{})[0].costUsd,null);
  const sale={...f,hash:`sale-${source}`,time:f.time+1,assets:{[id]:'-1'}};
  assert.equal(remainingBasis([f,sale],history,acquisitions)[id].usd,300);
}
console.log('PASS: purchase overlay and average buy share historical costs across all acquisition types.');
