import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historicalNftPrices,filterNftCollage,nftCollections} from '../delegators/portfolio-src/nft-collage.ts';
const fact=(hash,time,assets,adaRaw,extra={})=>({hash,time,assets,adaRaw,feeRaw:'1000000',internal:false,swapCandidate:true,...extra});
test('supplied NFT name hints label their policy collections without changing assets or counts',()=>{
  const aliases=[['Aesho of Devilube','Jelly Cubes'],['Ailen Hill','The Ape Society'],['alden Garrison','Strongholds by House Of Titans'],['Amulet of influence','The Mallard Order - Relics'],['101 Stanhope Terrace, KO71 R','The Ape Society Cabins'],['Ape Society Frame Level','The Ape Society Frames'],['Ape Society Frame Level 3','The Ape Society Frames']];
  for(const [assetName,collectionName] of aliases){
    const policy='a'.repeat(56),otherPolicy='b'.repeat(56);
    const rows=[{id:policy+'01',name:'Another NFT',raw:'0',firstReceived:100},{id:policy+'02',name:` ${assetName} `,raw:'1',firstReceived:200},{id:otherPolicy+'01',name:'Unrelated #1',raw:'1',firstReceived:300}];
    const original=JSON.stringify(rows),collections=nftCollections(rows);
    assert.deepEqual(collections.find(row=>row.policy===policy),{policy,count:2,name:collectionName});
    assert.equal(collections.find(row=>row.policy===otherPolicy).name,'Unrelated');
    assert.equal(filterNftCollage(rows,{}, {},'',policy,'date').length,2);
    assert.equal(JSON.stringify(rows),original);
  }
  assert.equal(nftCollections([{id:'a'.repeat(56)+'01',name:'constructor',raw:'1',firstReceived:100}])[0].name,'constructor');
});
test('collection counts include uncached historical NFTs and cabin hints label the whole policy group',()=>{
  const a='a'.repeat(56),b='b'.repeat(56);
  const rows=[{id:a+'01',name:'Another cabin',raw:'0',firstReceived:100},{id:a+'02',name:'101 Stanhope Terrace, KO71R',raw:'1',firstReceived:200},{id:b+'01',name:'Other #1',raw:'0',firstReceived:null}];
  const original=JSON.stringify(rows),collections=nftCollections(rows);
  assert.deepEqual(collections.find(row=>row.policy===a),{policy:a,count:2,name:'The Ape Society Cabins'});
  assert.equal(collections.find(row=>row.policy===b).count,1);
  assert.equal(collections.reduce((total,row)=>total+row.count,0),rows.length);
  assert.equal(filterNftCollage(rows,{}, {},'',a,'date').length,2);
  assert.equal(JSON.stringify(rows),original);
});
test('ADA Handle collection names use exact policies without renaming individual handles',()=>{
  const policies=['f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a','6c32db33a422e0bc2cb535bb850b5a6e9a9572222056d6ddc9cbc26e'];
  const rows=policies.map(policy=>({id:policy+'01',name:'$-lilsappys-',firstReceived:100,raw:'1'}));
  const original=JSON.stringify(rows);
  assert.deepEqual(nftCollections(rows).map(row=>row.name),['ADA Handle','ADA Handle']);
  assert.equal(filterNftCollage(rows,{}, {},'',policies[0],'date').length,1);
  assert.equal(JSON.stringify(rows),original);
  assert.notEqual(nftCollections([{...rows[0],id:'a'.repeat(56)+'01'}])[0].name,'ADA Handle');
});
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
