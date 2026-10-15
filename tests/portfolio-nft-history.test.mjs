import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nftTransactions,nftHighlights} from '../delegators/portfolio-src/nft-history.ts';
const a='a'.repeat(56)+'01',b='a'.repeat(56)+'02',c='b'.repeat(56)+'01';
const rows=[{id:a,name:'Frigid #1',raw:'0',firstReceived:100},{id:b,name:'Frigid #2',raw:'1',firstReceived:100},{id:c,name:'Other #1',raw:'1',firstReceived:100}];
const fact=(hash,time,assets,adaRaw='0',extra={})=>({hash,time,assets,adaRaw,feeRaw:'0',internal:false,swapCandidate:true,...extra});
test('NFT-only timeline identifies confirmed mints, allocated buys, sales and unknown transfers without mutation',()=>{
  const facts=[fact('mint',100,{[a]:'1'},'-3000000',{minted:{[a]:'1'}}),fact('gift',200,{[b]:'1'}),fact('buy',300,{[c]:'1',ft:'2'},'-5000000'),fact('sell',400,{[c]:'-1'},'7000000'),fact('ft',500,{ft:'5'},'-1000000')];
  const allocations={buy:{[c]:{source:'allocated-bundle',ada:4,time:300,raw:'1'}}},original=JSON.stringify({facts,rows,allocations});
  const events=nftTransactions(rows,[...facts,facts[0]],allocations);
  assert.equal(events.length,4);
  assert.deepEqual(events.map(e=>[e.kind,e.price]),[['Sell',7],['Buy',4],['Received',null],['Mint',null]]);
  assert.equal(JSON.stringify({facts,rows,allocations}),original);
  assert.deepEqual(nftHighlights(rows,events),{top:{policy:a.slice(0,56),count:2,name:'Frigid'},fastest:{name:'Other #1',id:c,seconds:100}});
});
test('fastest flip excludes transfers, mint sales, ambiguous quantities and same-time matches',()=>{
  for(const middle of [fact('gift',150,{[a]:'1'}),fact('sent',150,{[a]:'-1'}),fact('mint',150,{[a]:'1'},'0',{minted:{[a]:'1'}})]){
    const events=nftTransactions(rows,[fact('buy',100,{[a]:'1'},'-1000000'),middle,fact('sell',200,{[a]:'-1'},'2000000')]);
    assert.equal(nftHighlights(rows,events).fastest,null);
  }
  for(const facts of [[fact('buy',100,{[a]:'2'},'-1000000'),fact('sell',200,{[a]:'-1'},'2000000')],[fact('buy',100,{[a]:'1'},'-1000000'),fact('sell',100,{[a]:'-1'},'2000000')]])assert.equal(nftHighlights(rows,nftTransactions(rows,facts)).fastest,null);
});
test('repeated buys and sales pair separately, linked mints stay mints, invalid dates are omitted',()=>{
  const facts=[fact('buy',100,{[a]:'1'},'-1000000'),fact('sell',300,{[a]:'-1'},'2000000'),fact('buy2',400,{[a]:'1'},'-1000000'),fact('sell2',410,{[a]:'-1'},'2000000'),fact('linked',500,{[b]:'1'}),fact('bad',NaN,{[c]:'1'})];
  const events=nftTransactions(rows,facts,{linked:{[b]:{source:'linked-mint',ada:0,time:500,raw:'1'}}});
  assert.equal(events[0].kind,'Mint');assert.equal(events[0].price,0);
  assert.equal(nftHighlights(rows,events).fastest.seconds,10);
  assert.equal(events.length,5);
  assert.deepEqual(nftHighlights([],[]),{top:null,fastest:null});
});
