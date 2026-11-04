import assert from 'node:assert/strict';
import {test} from 'node:test';
import {saveWalletAddressBooks} from './wallet-address-book-save.ts';

test('wallets and CEX addresses are persisted in one vault update',()=>{
  const wallets=[{address:'owned',label:'Personal',personalType:'cex' as const}];
  const exchanges=[{address:'owned',name:'Old copy'},{address:'external',name:'Exchange',out:true}];
  let writes:Record<string,string>|undefined;
  const saved=saveWalletAddressBooks({setItems:values=>{writes=values;}},'wallets','cex',wallets,exchanges,['owned']);
  assert.deepEqual(saved,[exchanges[1]]);
  assert.deepEqual(writes,{wallets:JSON.stringify(wallets),cex:JSON.stringify([exchanges[1]])});
  assert.deepEqual(exchanges,[{address:'owned',name:'Old copy'},exchanges[1]],'source entries are not mutated');
});

test('a failed vault update does not report a successful save',()=>{
  const failure=new Error('vault unavailable');
  assert.throws(()=>saveWalletAddressBooks({setItems:()=>{throw failure;}},'wallets','cex',[{address:'owned',label:'Personal'}],[],['owned']),failure);
});
