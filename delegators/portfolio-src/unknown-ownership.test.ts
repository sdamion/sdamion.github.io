import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unknownOwnership,verifyOwnership} from './unknown-ownership.ts';
import type {Detail,Fact,Tx} from './core.ts';

test('unknown transactions are deduplicated and known excluded wallets remain known',()=>{
  const txs=['missing','known','foreign','missing'].map((tx_hash,i)=>({tx_hash,block_time:i,block_height:i} as Tx));
  const facts={known:{wallets:['mine']},foreign:{wallets:['other']}} as Record<string,Fact>;
  assert.deepEqual(unknownOwnership(txs,facts,new Set(['mine'])).map(t=>t.tx_hash),['missing','foreign']);
});
test('assignment requires a tracked address in the actual transaction',()=>{
  const detail={tx_hash:'tx',inputs:[],outputs:[{payment_addr:{bech32:'mine'}}]} as unknown as Detail;
  assert.doesNotThrow(()=>verifyOwnership(detail,'tx','mine',new Set(['mine'])));
  assert.throws(()=>verifyOwnership(detail,'tx','other',new Set(['mine','other'])));
  assert.throws(()=>verifyOwnership(detail,'wrong','mine',new Set(['mine'])));
  assert.throws(()=>verifyOwnership(detail,'tx','mine',new Set()));
});
