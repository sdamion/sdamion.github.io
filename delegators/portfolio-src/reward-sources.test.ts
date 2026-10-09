import test from 'node:test';
import assert from 'node:assert/strict';
import {isRewardSource,isRewardReceipt} from './reward-sources.ts';
import {isCardanoReward,isCexTransaction,cexAdaTransfer,cexAdaPerformance} from './cex.ts';
import {adaReceiptBasis,remainingBasis,type Fact} from './core.ts';
import {purchaseAverages} from './average-buy.ts';

const sources=[{address:'Source',name:'Services',miner:true}];
const receipt:Fact={hash:'receipt',time:1672963200,adaRaw:'2000000',feeRaw:'0',assets:{token:'100'},decimals:{token:0},internal:false,wallets:['Own'],swapCandidate:false,externalInputs:[{address:'Source',lovelace:'2000000'}],externalOutputs:[]};
const reward=(fact:Fact)=>isCardanoReward(fact,sources);

test('Source matching preserves case and requires all external inputs to be sources',()=>{
  assert.equal(isRewardSource('Source',sources),true);
  assert.equal(isRewardSource('source',sources),false);
  assert.equal(isRewardReceipt([],sources),false);
  assert.equal(isRewardReceipt([{address:'Unknown',stakeAddress:'Source'}],sources),true);
  assert.equal(reward({...receipt,externalInputs:[...receipt.externalInputs!,{address:'Other',lovelace:'1'}]}),false);
  assert.equal(reward({...receipt,internal:true}),false);
  assert.equal(reward({...receipt,adaRaw:'-1'}),false);
  assert.equal(reward({...receipt,assets:{token:'-1'}}),false);
});

test('ADA and token service receipts have zero basis without prices and are not CEX purchases',()=>{
  assert.equal(cexAdaTransfer(receipt,sources),null);
  assert.equal(isCexTransaction(receipt,sources),false);
  assert.equal(cexAdaTransfer({...receipt,externalInputs:[...receipt.externalInputs!,{address:'Exchange',lovelace:'1'}]},[...sources,{address:'Exchange',name:'Exchange'}]),null);
  assert.equal(adaReceiptBasis([receipt],{},undefined,reward).usd,0);
  const basis=remainingBasis([receipt],{}, {},reward);
  assert.deepEqual(basis.token,{raw:'100',usd:0});
  assert.deepEqual(purchaseAverages([receipt,receipt],{}, {},reward).token,{raw:100n,usd:0,count:1});
  assert.equal(remainingBasis([receipt],{}).token.usd,null);
});

test('A later exchange sale consumes zero-cost service receipts',()=>{
  const sale:Fact={...receipt,hash:'sale',time:receipt.time+1,adaRaw:'-1000000',assets:{},externalInputs:[],externalOutputs:[{address:'Exchange',lovelace:'1000000'}]};
  const result=cexAdaPerformance([receipt,sale],[...sources,{address:'Exchange',name:'Exchange'}],{'2023-01-06':2},true);
  assert.equal(result.boughtRaw,'0');
  assert.equal(result.soldRaw,'1000000');
  assert.equal(result.realisedUsd,2);
});
