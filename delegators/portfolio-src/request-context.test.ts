import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cardanoRequestContext} from './request-context.ts';
test('failed requests identify their endpoint, batch size and history page without exposing addresses',()=>{
  assert.equal(cardanoRequestContext('address_txs',{_addresses:['private-a','private-b']},'1000-1999'),'/address_txs (2 wallet addresses, rows 1000-1999)');
  assert.equal(cardanoRequestContext('tx_info',{_tx_hashes:['hash']}),'/tx_info (1 transactions)');
  assert.equal(cardanoRequestContext('account_addresses',{_stake_addresses:['stake']}),'/account_addresses (1 stake addresses)');
});
