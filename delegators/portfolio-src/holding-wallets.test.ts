import assert from 'node:assert/strict';
import {test} from 'node:test';
import {holdingWalletNames} from './core.ts';

test('holdings identify named wallets through linked addresses without duplicate labels',()=>{
  const info=(address:string,quantity:string)=>({address,balance:'1000000',utxo_set:[{tx_hash:address,tx_index:0,value:'1000000',asset_list:[{policy_id:'policy',asset_name:'token',quantity}]}]});
  const result=holdingWalletNames([info('a','1'),info('b','2'),info('c','1'),info('d','0')],[
    {address:'stake',label:'Member stake address'},
    {address:'c',label:'Savings'},
    {address:'d',label:'Empty'},
    {address:'a',label:'Swap',group:'swap'},
  ],{stake:['a','b']});
  assert.deepEqual(result.policytoken,['Member stake address','Savings']);
  assert.deepEqual(result.lovelace,['Member stake address','Savings','Empty']);
});

test('unmapped holdings use the address rather than an incorrect wallet name',()=>{
  assert.deepEqual(holdingWalletNames([{address:'unknown',balance:'1',utxo_set:[{tx_hash:'tx',tx_index:0,value:'1'}]}],[]),{lovelace:['unknown']});
});
