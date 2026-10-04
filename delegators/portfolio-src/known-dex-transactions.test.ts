import assert from 'node:assert/strict';
import {bech32} from '@scure/base';
import {knownDexAddresses} from './known-dex-addresses.ts';
import {knownTransactionDexNames} from './known-dex-transactions.ts';
import {transactionWalletNames} from './transaction-wallet-names.ts';
import {matchesTransaction} from './transaction-search.ts';
import type {Fact} from './core.ts';

const base:Fact={hash:'test',time:1,adaRaw:'0',feeRaw:null,assets:{},decimals:{},internal:false,wallets:['mine'],swapCandidate:true};
function address(hash:string,header=0x71){return bech32.encode('addr',bech32.toWords(Uint8Array.from([header,...hash.match(/../g)!.map(hex=>parseInt(hex,16))])),200);}
for(const entry of knownDexAddresses){
  const addr=entry.address??address(entry.scriptHash);
  for(const direction of ['externalInputs','externalOutputs'] as const){
    const fact={...base,[direction]:[{address:addr,lovelace:'123'}]};
    const before=JSON.stringify(fact);
    assert.ok(knownTransactionDexNames(fact).includes(entry.name));
    assert.equal(matchesTransaction(entry.name,fact.hash,fact,{},[]),true);
    assert.ok(transactionWalletNames(fact,[{address:'mine',label:'Savings'}]).includes(`DEX contract: ${entry.name}`));
    assert.equal(JSON.stringify(fact),before,'recognition must not mutate accounting data');
  }
}
const script=knownDexAddresses.find(entry=>entry.scriptHash)!.scriptHash!;
assert.deepEqual(knownTransactionDexNames({...base,externalInputs:[{address:address(script,0x61),lovelace:'1'}]}),[],'key credential must not match script');
assert.deepEqual(knownTransactionDexNames({...base,externalInputs:[{address:address(script,0x70),lovelace:'1'}]}),[],'testnet must not match');
assert.deepEqual(knownTransactionDexNames({...base,externalInputs:[{address:'invalid',lovelace:'1'}]}),[]);
const addr=address(script);
const names=knownTransactionDexNames({...base,externalInputs:[{address:addr,lovelace:'1'}],externalOutputs:[{address:addr,lovelace:'1'}]});
assert.equal(names.length,1);
assert.deepEqual(knownTransactionDexNames({...base,source:{tx_hash:'test',tx_timestamp:1,fee:'1',inputs:[{payment_addr:{bech32:addr},value:'1'}],outputs:[]}}),names);
console.log('PASS: known DEX recognition on both transaction sides, safe credentials, deduplication and unchanged amounts.');
