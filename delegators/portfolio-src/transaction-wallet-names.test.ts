import assert from 'node:assert/strict';
import {transactionWalletNames} from './transaction-wallet-names.ts';
import type {Fact,Wallet} from './core';
const fact={wallets:['mine'],externalInputs:[{address:'swap',lovelace:'1'}]} as Fact;
const wallets:Wallet[]=[{address:'mine',label:'Member stake address'},{address:'mine',label:'Savings'},{address:'swap',label:'My exchange',group:'swap'},{address:'other',label:'Unrelated swap',group:'swap'}];
assert.deepEqual(transactionWalletNames(fact,wallets),['Savings','My exchange']);
assert.deepEqual(transactionWalletNames(undefined,wallets),[]);
assert.deepEqual(transactionWalletNames({...fact,externalInputs:[]},wallets),['Savings']);
console.log('PASS: explicit wallet names preferred, matching swap names included, unrelated swaps excluded.');
