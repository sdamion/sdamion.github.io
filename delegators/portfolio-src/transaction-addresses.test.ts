import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cardanoTransactionAddresses,uniqueTransactionAddresses,walletFlowAddresses} from './transaction-addresses.ts';
import {displayedPaidFee} from './transaction-amounts.ts';
import type {Fact} from './core.ts';

test('address rows deduplicate within a direction, without normalizing chain addresses',()=>{
  assert.deepEqual(uniqueTransactionAddresses([{address:'AbC'},{address:''},{address:'AbC'},{address:'abc'}]),[{address:'AbC'},{address:'abc'}]);
});
test('Cardano outgoing flow hides change and unrelated co-inputs without modifying source data',()=>{
  const fact={source:{inputs:[{payment_addr:{bech32:'owned'},stake_addr:'stake'},{payment_addr:{bech32:'sender'}},{payment_addr:{bech32:'sender'}}],outputs:[{payment_addr:{bech32:'owned'}},{payment_addr:{bech32:'unknown'}},{stake_addr:'no-payment-address'}]}} as Fact;
  const before=JSON.stringify(fact);
  assert.deepEqual(cardanoTransactionAddresses(fact,[{address:'stake',label:'My wallet'}],[{address:'sender',name:'Exchange',direction:'From'}]),{
    from:[{address:'owned',name:'My wallet'}],to:[{address:'unknown',name:undefined}]
  });
  assert.equal(JSON.stringify(fact),before);
});
test('legacy Cardano never guesses owned-wallet direction without source details',()=>{
  const fact={wallets:['owned'],externalInputs:[{address:'sender',lovelace:'1'}],externalOutputs:[{address:'receiver',lovelace:'1'}]} as Fact;
  assert.deepEqual(cardanoTransactionAddresses(fact,[{address:'owned',label:'Own'}],[]),{from:[],to:[]});
  assert.deepEqual(cardanoTransactionAddresses(undefined,[],[]),{from:[],to:[]});
});
test('incoming flow hides other recipients and outgoing flow hides change; internal transfers remain',()=>{
  const own={address:'own'},sender={address:'sender'},other={address:'other'},isOwn=(row:{address:string})=>row.address==='own';
  assert.deepEqual(walletFlowAddresses([sender],[own,other],isOwn,true),{from:[sender],to:[own]});
  assert.deepEqual(walletFlowAddresses([own],[other,own],isOwn,false),{from:[own],to:[other]});
  assert.deepEqual(walletFlowAddresses([own],[own],isOwn,false),{from:[own],to:[own]});
  assert.deepEqual(walletFlowAddresses([sender],[other],isOwn,false),{from:[],to:[]});
});
test('Cardano displayed fee is wallet-paid only; mixed input attribution stays unknown',()=>{
  const fact={feeRaw:null,source:{fee:'170000',inputs:[{payment_addr:{bech32:'sender'}}],outputs:[]}} as unknown as Fact;
  const wallets=[{address:'own',label:'Own'}],before=JSON.stringify(fact);
  assert.equal(displayedPaidFee(fact,wallets),'0');
  assert.equal(displayedPaidFee({...fact,source:{...fact.source!,inputs:[{payment_addr:{bech32:'own'},value:'1'}]}},wallets),'170000');
  assert.equal(displayedPaidFee({...fact,source:{...fact.source!,inputs:[{payment_addr:{bech32:'own'},value:'1'},...fact.source!.inputs]}},wallets),null);
  assert.equal(displayedPaidFee(undefined,wallets),null);
  assert.equal(JSON.stringify(fact),before);
});
