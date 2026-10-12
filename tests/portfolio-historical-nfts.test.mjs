import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historicalNfts} from '../delegators/portfolio-src/historical-nfts.ts';

test('includes sold NFTs and current holdings exactly once without counting FTs or unrelated metadata',()=>{
  const facts=[{assets:{sold:'-1',held:'1',ft:'500'}},{assets:{sold:'1',held:'0'}}];
  const holdings=[{id:'held',raw:'1'},{id:'unspent',raw:'1'}];
  const markets=Object.fromEntries(['sold','held','unspent','unrelated'].map(id=>[id,{name:id,is_nft:true}]));
  markets.ft={name:'ft',is_nft:false};
  const originals=JSON.stringify({facts,holdings,markets});
  assert.deepEqual(historicalNfts(facts,holdings,markets),[{id:'held',name:'held',raw:'1'},{id:'sold',name:'sold',raw:'0'},{id:'unspent',name:'unspent',raw:'1'}]);
  assert.equal(JSON.stringify({facts,holdings,markets}),originals);
  assert.deepEqual(historicalNfts([],[],markets),[]);
});
