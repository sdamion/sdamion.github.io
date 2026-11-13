import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetReceiptDates,sortAssetsByDate} from './asset-dates.ts';
import {mergeHistoricalNfts} from './historical-nfts.ts';
import {filterNftCollage} from './nft-collage.ts';

test('all chains interleave by receipt date, with stable ties and undated assets last',()=>{
  const rows=[
    {id:'cardano:old',name:'Old',firstReceived:100},
    {id:'ethereum:art',name:'Art',firstReceived:400},
    {id:'robinhood:art',name:'Art',firstReceived:200},
    {id:'solana:art',name:'Art',firstReceived:500},
    {id:'bitcoin:ordinal:id',name:'Art',firstReceived:300},
    {id:'ethereum:unknown',name:'A missing date',firstReceived:null},
    {id:'cardano:invalid',name:'Z invalid date',firstReceived:Infinity}
  ];
  const original=JSON.stringify(rows);
  assert.deepEqual(sortAssetsByDate(rows).map(row=>row.id),['solana:art','ethereum:art','bitcoin:ordinal:id','robinhood:art','cardano:old','ethereum:unknown','cardano:invalid']);
  assert.equal(JSON.stringify(rows),original);
  assert.deepEqual(sortAssetsByDate([{id:'solana:b',name:'Same',firstReceived:1},{id:'ethereum:a',name:'Same',firstReceived:1}]).map(row=>row.id),['ethereum:a','solana:b']);
});

test('receipt dates use confirmed incoming history and never inventory checks, outgoing transfers or internal moves',()=>{
  const own='0x'+'1'.repeat(40),second='0x'+'2'.repeat(40),outside='0x'+'3'.repeat(40);
  const tx=(time:number,patch={})=>({id:String(time),hash:String(time),kind:'normal' as const,block:1,time,from:outside,to:own,valueWei:'1',feeWei:'0',failed:false,...patch});
  const dates=assetReceiptDates({
    facts:[{time:250,adaRaw:'1',assets:{token:'1'},internal:false},{time:260,adaRaw:'1',assets:{token:'1'},internal:false},{time:50,adaRaw:'1',assets:{token:'1'},internal:true}] as any,
    nfts:[{id:'nft',name:'Cardano NFT',raw:'1',firstReceived:450},{id:'bitcoin:ordinal:art',name:'Ordinal',raw:'1',firstReceived:500}],
    ethereum:{wallets:[{address:own,name:'One'},{address:second,name:'Two'}],data:{accounts:{[own]:{balanceWei:'1',block:1,transactions:[tx(300),tx(100,{from:second}),tx(50,{failed:true}),tx(40,{block:0}),tx(20,{to:outside,from:own}),tx(10,{valueWei:'0'})]}},history:{},usd:1,updated:null}},
    robinhood:{wallets:[{address:own,name:'RH'}],data:{accounts:{[own]:{balanceWei:'1',block:1,transactions:[tx(200)]}},history:{},usd:1,updated:null},tokens:{[own]:[{id:'robinhood:4663:token',hash:'hash',logIndex:0,from:outside,to:own,time:350,name:'Token',symbol:'T',raw:'1',decimals:0}]}},
    solana:{wallets:[{address:'own',name:'SOL'}],data:{accounts:{own:{raw:'1',slot:1,checkpoint:null,transactions:[{hash:'sol',time:400,slot:1,payer:'other',feeRaw:'1',failed:false,transfers:[{from:'other',to:'own',raw:'1'}]}]}},history:{},usd:1}},
    bitcoin:{wallets:[{address:'own',name:'BTC'}],data:{accounts:{own:{raw:'1',tip:'tip',transactions:[{hash:'btc',time:150,height:1,feeRaw:'1',inputs:[{address:'other',raw:'2'}],outputs:[{address:'own',raw:'1'}]},{hash:'change',time:10,height:1,feeRaw:'1',inputs:[{address:'own',raw:'3'}],outputs:[{address:'own',raw:'1'}]}]}},history:{},usd:1}}
  });
  assert.deepEqual(dates,{'cardano:lovelace':250,'cardano:token':250,'cardano:nft':450,'bitcoin:ordinal:art':500,'ethereum:native':300,'robinhood:native':200,'robinhood:4663:token':350,'solana:native':400,'bitcoin:native':150});
  assert.equal(dates['ethereum:unknown-token'],undefined);
});

test('owned NFTs carry known receipt dates into the combined history without replacing historical dates',()=>{
  const asset=(id:string,chain:'ethereum'|'solana',firstReceived:number)=>({id,chain,name:id,standard:chain==='ethereum'?'ERC-721':'NFT',symbol:'',raw:'1',decimals:0,image:null,explorer:null,wallets:['Wallet'],firstReceived});
  const owned=[asset('ethereum:art','ethereum',300),asset('solana:art','solana',500)];
  const rows=mergeHistoricalNfts([{id:'ethereum:art',chain:'ethereum',name:'ETH',raw:'1',firstReceived:200}],owned);
  assert.deepEqual(rows.map(row=>[row.id,row.firstReceived]),[['solana:art',500],['ethereum:art',200]]);
  assert.deepEqual(filterNftCollage(rows,{}, {},'','','date').map(row=>row.id),['solana:art','ethereum:art']);
});
