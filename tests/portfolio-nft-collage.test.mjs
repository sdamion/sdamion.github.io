import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historicalNftPrices,filterNftCollage,nftCollections} from '../delegators/portfolio-src/nft-collage.ts';
const fact=(hash,time,assets,adaRaw,extra={})=>({hash,time,assets,adaRaw,feeRaw:'1000000',internal:false,swapCandidate:true,...extra});
test('uses latest known allocated purchases and per-NFT trade proceeds, never unknown transfers',()=>{
  const facts=[fact('buy',10,{nft:'1'},'-11000000'),fact('sell',20,{nft:'-2'},'39000000'),fact('transfer',30,{nft:'1'},'0'),fact('bundle',40,{nft:'1',other:'1'},'-50000000'),fact('internal',50,{nft:'1'},'-90000000',{internal:true})];
  const originals=JSON.stringify(facts);
  assert.deepEqual(historicalNftPrices([...facts,facts[0]]),{nft:{buy:11,sell:20}});
  const allocations={bundle:{nft:{ada:25,time:40}}};
  assert.deepEqual(historicalNftPrices(facts,allocations),{nft:{buy:25,sell:20}});
  assert.equal(JSON.stringify(facts),originals);
});
test('zero-price allocations are available, and unallocated multi-asset sales remain unknown',()=>{
  const facts=[fact('mint',10,{nft:'1'},'-1000000',{minted:{nft:'1'}}),fact('bundle-sale',20,{nft:'-1',other:'-1'},'100000000')];
  assert.deepEqual(historicalNftPrices(facts,{mint:{nft:{ada:0,time:10}}}),{nft:{buy:0,sell:null}});
});
test('filters exact collections and shared normalized search; sorts known prices both ways with unknowns last',()=>{
  const a='a'.repeat(56),b='b'.repeat(56);
  const rows=[{id:a+'01',name:'Frigid #1',firstReceived:100,raw:'1'},{id:a+'02',name:'Frigid #2',firstReceived:200,raw:'0'},{id:b+'01',name:'Other #1',firstReceived:null,raw:'0'}];
  const prices={[rows[0].id]:{buy:10,sell:null},[rows[1].id]:{buy:30,sell:5}},wallets={[rows[0].id]:['Ledger']};
  assert.equal(filterNftCollage(rows,prices,wallets,'frigid2',a,'date')[0].id,a+'02');
  assert.equal(filterNftCollage(rows,prices,wallets,'ledger','','date')[0].id,a+'01');
  assert.deepEqual(filterNftCollage(rows,prices,wallets,'','','buy-low').map(row=>row.id),[a+'01',a+'02',b+'01']);
  assert.deepEqual(filterNftCollage(rows,prices,wallets,'','','buy-high').map(row=>row.id),[a+'02',a+'01',b+'01']);
  assert.equal(filterNftCollage(rows,prices,wallets,'','','sell-high')[0].id,a+'02');
  assert.equal(nftCollections(rows).length,2);assert.equal(nftCollections(rows)[0].name,'Frigid');
  assert.equal(rows[0].id,a+'01');
});
