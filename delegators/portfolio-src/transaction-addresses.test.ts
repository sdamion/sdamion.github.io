import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cardanoTransactionAddresses,uniqueTransactionAddresses} from './transaction-addresses.ts';
import type {Fact} from './core.ts';

test('address rows deduplicate within a direction, without normalizing chain addresses',()=>{
  assert.deepEqual(uniqueTransactionAddresses([{address:'AbC'},{address:''},{address:'AbC'},{address:'abc'}]),[{address:'AbC'},{address:'abc'}]);
});
test('Cardano uses complete chain inputs and outputs, retaining change and unknown addresses',()=>{
  const fact={source:{inputs:[{payment_addr:{bech32:'owned'},stake_addr:'stake'},{payment_addr:{bech32:'sender'}},{payment_addr:{bech32:'sender'}}],outputs:[{payment_addr:{bech32:'owned'}},{payment_addr:{bech32:'unknown'}},{stake_addr:'no-payment-address'}]}} as Fact;
  const before=JSON.stringify(fact);
  assert.deepEqual(cardanoTransactionAddresses(fact,[{address:'stake',label:'My wallet'}],[{address:'sender',name:'Exchange',direction:'From'}]),{
    from:[{address:'owned',name:'My wallet'},{address:'sender',name:'Exchange'}],to:[{address:'owned',name:undefined},{address:'unknown',name:undefined}]
  });
  assert.equal(JSON.stringify(fact),before);
});
test('legacy Cardano only displays recorded directions and never guesses owned-wallet direction',()=>{
  const fact={wallets:['owned'],externalInputs:[{address:'sender',lovelace:'1'}],externalOutputs:[{address:'receiver',lovelace:'1'}]} as Fact;
  assert.deepEqual(cardanoTransactionAddresses(fact,[{address:'owned',label:'Own'}],[]),{from:[{address:'sender',name:undefined}],to:[{address:'receiver',name:undefined}]});
  assert.deepEqual(cardanoTransactionAddresses(undefined,[],[]),{from:[],to:[]});
});
