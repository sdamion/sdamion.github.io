import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cardanoAddressRows,type CardanoAddressBook} from './cardano-addresses.ts';
import type {Snapshot} from './cache.ts';

function fixture(){
  const book:CardanoAddressBook={wallets:[{address:'stake',label:'Primary'},{address:'own',label:'Own'},{address:'swap',label:'Swap',group:'swap',swapAddresses:['linked']}],exchanges:[{address:'dex',name:'Dex',dex:true},{address:'cex',name:'Cex',dex:false},{address:'legacy',name:'Legacy'}],snapshot:{groups:{stake:['pay1','pay2']},infos:[{address:'pay1',balance:'1234567'},{address:'pay2',balance:'7654321'}]} as Snapshot,memberStake:'stake',busy:false,usd:1,onView:()=>{},saveWallets:rows=>{book.wallets=rows;return true;},saveExchanges:rows=>{book.exchanges=rows;return true;}};
  return book;
}
test('Cardano produces the same own-address row model, preserving primary protection and linked-detail actions',()=>{
  const book=fixture(),before=JSON.stringify(book.snapshot);let viewed='';book.onView=address=>{viewed=address;};
  const rows=cardanoAddressRows(book,true);assert.equal(rows.length,2);assert.equal(rows[0].removeDisabled,true);assert.equal(rows[1].removeDisabled,false);
  assert.equal(rows[0].balance?.raw,'8888888');assert.equal(rows[0].balance?.symbol,'ADA');assert.equal(rows[1].note,'Loading balance…');
  rows[0].onView!();assert.equal(viewed,'stake');rows[0].onRename('Renamed');assert.equal(book.wallets[0].label,'Renamed');assert.equal(book.wallets[2].group,'swap');
  assert.equal(JSON.stringify(book.snapshot),before);
});
test('Cardano DEX/CEX/Swap rows preserve legacy types, metadata, linked addresses and isolated actions',()=>{
  const book=fixture();let rows=cardanoAddressRows(book);assert.deepEqual(rows.map(row=>row.kind),['DEX','CEX','DEX / CEX','Swap']);
  rows[0].onMining!(true);rows=cardanoAddressRows(book);assert.equal(rows[0].out,false);assert.equal(rows[0].miner,true);
  rows[0].onOut!(true);rows=cardanoAddressRows(book);assert.equal(rows[0].miner,false);assert.equal(rows[0].out,true);assert.equal(rows[0].kind,'DEX');
  rows[0].onRename('Renamed');assert.equal(book.exchanges[0].dex,true);assert.equal(book.exchanges[0].address,'dex');
  const swap=cardanoAddressRows(book).find(row=>row.kind==='Swap')!;assert.deepEqual(swap.linked,['linked']);assert.equal(swap.onOut,undefined);assert.equal(swap.onMining,undefined);
  swap.onRemove();assert.equal(book.wallets.length,2);assert.equal(book.exchanges.length,3);
  book.saveExchanges=()=>false;const before=JSON.stringify(book.exchanges);assert.equal(cardanoAddressRows(book)[0].onRemove(),false);assert.equal(JSON.stringify(book.exchanges),before);
});
