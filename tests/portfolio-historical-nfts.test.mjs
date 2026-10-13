import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historicalNfts} from '../delegators/portfolio-src/historical-nfts.ts';

test('includes sold NFTs and current holdings exactly once without counting FTs or unrelated metadata',()=>{
  const facts=[{assets:{sold:'-1',held:'1',ft:'500'}},{assets:{sold:'1',held:'0'}}];
  const holdings=[{id:'held',raw:'1'},{id:'unspent',raw:'1'}];
  const markets=Object.fromEntries(['sold','held','unspent','unrelated'].map(id=>[id,{name:id,is_nft:true}]));
  markets.ft={name:'ft',is_nft:false};
  const originals=JSON.stringify({facts,holdings,markets});
  assert.deepEqual(historicalNfts(facts,holdings,markets),[{id:'held',name:'held',raw:'1',firstReceived:null},{id:'sold',name:'sold',raw:'0',firstReceived:null},{id:'unspent',name:'unspent',raw:'1',firstReceived:null}]);
  assert.equal(JSON.stringify({facts,holdings,markets}),originals);
  assert.deepEqual(historicalNfts([],[],markets),[]);
});
test('first receipt uses the earliest valid incoming transaction, not a sale or zero delta',()=>{
  const facts=[{time:200,assets:{nft:'1'}},{time:50,assets:{nft:'-1'}},{time:10,assets:{nft:'0'}},{time:100,assets:{nft:'1'}},{time:NaN,assets:{nft:'1'}},{time:1e30,assets:{nft:'1'}}];
  const markets={nft:{name:'NFT',is_nft:true}};
  assert.equal(historicalNfts(facts,[],markets)[0].firstReceived,100);
  assert.equal(historicalNfts([{time:100,assets:{nft:'-1'}}],[],markets)[0].firstReceived,null);
});
test('sorts by first receipt newest first, with stable name ties and unknown dates last',()=>{
  const facts=[{time:100,assets:{old:'1'}},{time:300,assets:{old:'1',newest:'1'}},{time:200,assets:{tieZ:'1',tieA:'1'}},{time:400,assets:{unknown:'-1'}}];
  const markets=Object.fromEntries(['old','newest','tieZ','tieA','unknown'].map(id=>[id,{name:id,is_nft:true}]));
  const original=JSON.stringify(facts);
  assert.deepEqual(historicalNfts(facts,[],markets).map(row=>row.id),['newest','tieA','tieZ','old','unknown']);
  assert.equal(JSON.stringify(facts),original);
});
