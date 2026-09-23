import assert from 'node:assert/strict';
import {transactionExchangeWallets} from './cex.ts';
import type {Fact} from './core';
const fact={internal:false,externalInputs:[{address:'byron-A',lovelace:'100'},{address:'byron-A',lovelace:'200'},{address:'byron-B',lovelace:'300'}],externalOutputs:[{address:'payment-C',stakeAddress:'stake-C',lovelace:'50'},{address:'unknown',lovelace:'1'}]} as Fact;
const entries=[{address:'byron-A',name:'Exchange A'},{address:'byron-B',name:'Exchange B'},{address:'stake-C',name:'Exchange C'}];
assert.deepEqual(transactionExchangeWallets(fact,entries),[
  {address:'byron-A',name:'Exchange A',direction:'From'},
  {address:'byron-B',name:'Exchange B',direction:'From'},
  {address:'payment-C',name:'Exchange C',direction:'To'}
]);
assert.deepEqual(transactionExchangeWallets({...fact,internal:true},entries),[]);
assert.deepEqual(transactionExchangeWallets(undefined,entries),[]);
console.log('PASS: exchange labels, directions, actual transaction addresses and duplicate suppression.');
