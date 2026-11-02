import test from 'node:test';
import assert from 'node:assert/strict';
import {nftTradePairs,nftCyclePrices,groupNftRows} from './nft-pairs.ts';
import type {NftEvent} from './nft-history.ts';
const event=(id:string,hash:string,time:number,kind:NftEvent['kind'],price:number|null=1,raw=['Buy','Mint','Received'].includes(kind)?'1':'-1'):NftEvent=>({id,hash,time,kind,price,raw,name:'Same NFT name'});
test('exact NFT IDs pair acquisition and sale cycles without mutating or reusing events',()=>{
  const events=[event('a','buy',10,'Buy',3),event('a','sell',20,'Sell',5),event('a','mint',30,'Mint',0),event('a','sell2',40,'Sell',8),event('b','buy2',50,'Buy',6),event('c','sell3',60,'Sell',9)];
  const original=JSON.stringify(events),pairs=nftTradePairs([...events].reverse().concat(events[0]));
  assert.deepEqual(pairs.map(pair=>[pair.id,pair.acquisition.hash,pair.sale.hash]),[['a','buy','sell'],['a','mint','sell2']]);
  assert.deepEqual(nftCyclePrices(events).a,{buy:0,sell:8,acquisition:'Mint'});
  assert.deepEqual(nftCyclePrices([...events,event('a','rebuy',70,'Buy',12)]).a,{buy:12,sell:null,acquisition:'Buy'});
  assert.equal(JSON.stringify(events),original);
});
test('unknown transfers, burns, duplicate holdings, quantities and unknown intrablock order do not create pairs',()=>{
  for(const middle of ['Received','Sent','Burn'] as const)assert.deepEqual(nftTradePairs([event('a','buy',10,'Buy'),event('a','middle',20,middle),event('a','sell',30,'Sell')]),[]);
  assert.deepEqual(nftTradePairs([event('a','buy',10,'Buy'),event('a','buy2',20,'Buy'),event('a','sell',30,'Sell')]),[]);
  assert.deepEqual(nftTradePairs([event('a','buy',10,'Buy',2,'2'),event('a','sell',30,'Sell')]),[]);
  assert.deepEqual(nftTradePairs([event('a','buy',10,'Buy'),event('a','sell',10,'Sell')]),[]);
  assert.equal(nftTradePairs([event('a','buy',10,'Buy'),event('a','internal',20,'Internal transfer'),event('a','sell',30,'Sell')]).length,1);
});
test('row grouping preserves swaps, all original rows, filter boundaries and transaction uniqueness',()=>{
  const events=[event('a','buy',10,'Buy'),event('a','sell',20,'Sell')],pairs=nftTradePairs(events);
  const row=(hash:string,chain='cardano')=>({chain,tx:{tx_hash:hash}});
  const buy=row('buy'),sale=row('sell'),other=row('other'),eth=row('eth','ethereum');
  const original=[[sale],[other],[buy]],grouped=groupNftRows(original,pairs);
  assert.deepEqual(grouped.map(group=>group.rows),[[buy,sale],[other]]);
  assert.equal(grouped[0].nft,pairs[0]);assert.deepEqual(original,[[sale],[other],[buy]]);
  assert.deepEqual(groupNftRows([[sale]],pairs),[{rows:[sale]}]);
  assert.deepEqual(groupNftRows([[sale],[buy,eth]],pairs),[{rows:[sale]},{rows:[buy,eth]}]);
  const shared=[...events,event('b','buy',10,'Buy'),event('b','sell2',30,'Sell')];
  assert.ok(groupNftRows([[sale],[row('sell2')],[buy]],nftTradePairs(shared)).every(group=>!group.nft),'multi-NFT transaction cannot appear in two paired rows');
});
