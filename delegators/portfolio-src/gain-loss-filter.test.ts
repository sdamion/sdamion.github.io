import assert from 'node:assert/strict';
import {matchesGainLossTransfer} from './gain-loss-filter.ts';
import type {Fact} from './core';
const entries=[{address:'exchange',name:'Exchange'}];
const base={hash:'tx',time:1,adaRaw:'100',feeRaw:'0',internal:false,wallets:['owned'],assets:{},decimals:{},swapCandidate:false} satisfies Fact;
const incoming={...base,externalInputs:[{address:'exchange',lovelace:'100'}]};
const outgoing={...base,adaRaw:'-100',externalOutputs:[{address:'exchange',lovelace:'100'}]};
assert.equal(matchesGainLossTransfer(incoming,entries,'all'),true);
assert.equal(matchesGainLossTransfer(outgoing,entries,'all'),true);
assert.equal(matchesGainLossTransfer(incoming,entries,'in'),true);
assert.equal(matchesGainLossTransfer(incoming,entries,'out'),false);
assert.equal(matchesGainLossTransfer(outgoing,entries,'out'),true);
assert.equal(matchesGainLossTransfer(outgoing,entries,'in'),false);
for(const filter of ['all','in','out']){
  assert.equal(matchesGainLossTransfer(base,entries,filter),false);
  assert.equal(matchesGainLossTransfer({...incoming,internal:true},entries,filter),false);
  assert.equal(matchesGainLossTransfer(undefined,entries,filter),false);
  assert.equal(matchesGainLossTransfer({...incoming,externalInputs:[...incoming.externalInputs,{address:'other',lovelace:'100'}]},entries,filter),false);
}
console.log('PASS: gain/loss scope retains only verified exchange inflows/outflows across all filters');
