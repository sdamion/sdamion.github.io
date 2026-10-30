import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyse,type Detail} from './core.ts';
import {cexAdaTransfer,cexTimeline,cexUsdNetPosition} from './cex.ts';
import {matchesGainLossTransfer} from './gain-loss-filter.ts';

// Same public input/output amounts as the reported transfer, with synthetic addresses.
const detail:Detail={
  tx_hash:'reward-funded-exchange-transfer',tx_timestamp:1776437079,fee:'199865',
  inputs:[
    {payment_addr:{bech32:'owned'},value:'3297150'},
    {payment_addr:{bech32:'owned'},value:'1612027287'}
  ],
  outputs:[
    {payment_addr:{bech32:'exchange'},value:'1611828916'},
    {payment_addr:{bech32:'owned'},value:'3297150'}
  ]
};
const entries=[{address:'exchange',name:'Exchange'}];

test('staking withdrawal does not hide an exchange output funded by owned inputs',()=>{
  const fact=analyse(detail,new Set(['owned']));
  assert.equal(BigInt(fact.adaRaw)+BigInt(fact.feeRaw!),-1611827422n);
  assert.deepEqual(cexAdaTransfer(fact,entries),{side:'sell',raw:1611828916n});
  assert.equal(matchesGainLossTransfer(fact,entries,'all'),true);
  assert.equal(matchesGainLossTransfer(fact,entries,'out'),true);
  assert.equal(matchesGainLossTransfer(fact,entries,'in'),false);
  const day=new Date(fact.time*1000).toISOString().slice(0,10);
  const history={[day]:1};
  assert.equal(cexTimeline([fact,fact],entries,history).length,1);
  assert.equal(cexUsdNetPosition([fact],entries,'3297150',history,1).soldUsd,1611.828916);
});

test('unowned inputs still prevent attributing an entire exchange payment to this wallet',()=>{
  const mixed=analyse({...detail,inputs:[...detail.inputs,{payment_addr:{bech32:'other'},value:'1000000'}]},new Set(['owned']));
  assert.equal(mixed.feeRaw,null);
  assert.equal(cexAdaTransfer(mixed,entries),null);
});

test('exchange return transfers remain ADA IN from the receiving wallet perspective',()=>{
  const fact=analyse({...detail,inputs:[{payment_addr:{bech32:'exchange'},value:'1612028781'}],outputs:[{payment_addr:{bech32:'owned'},value:'1611828916'}]},new Set(['owned']));
  assert.deepEqual(cexAdaTransfer(fact,entries),{side:'buy',raw:1611828916n});
  assert.equal(matchesGainLossTransfer(fact,entries,'in'),true);
  assert.equal(matchesGainLossTransfer(fact,entries,'out'),false);
});
