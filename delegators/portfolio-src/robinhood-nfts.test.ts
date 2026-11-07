import assert from 'node:assert/strict';
import test from 'node:test';
import {mergeHistoricalNfts} from './historical-nfts.ts';
import {robinhoodHistoricalNfts} from './robinhood-nfts.ts';
import type {RobinhoodNftTransfer} from './use-robinhood.ts';

const wallet='0xcf2ceee89dffbcea8b784cd453a21167e68b3aa0';
const contract='0x0d58589536f442da1c192c89232448c23d8b41bb';
const id=`robinhood:4663:${contract}:9743`;
const image='https://dweb.link/ipfs/bafybeiauc5dhy4kgfotn3sbodwis7bhl2uq6lci3tailo2ophxq3k6odzq';
const transfer:RobinhoodNftTransfer={id,hash:'0x'+'a'.repeat(64),logIndex:25,from:'0x'+'0'.repeat(40),to:wallet,time:1794000000,name:'TMO: INITIATES',image};

test('Robinhood NFT history keeps the image and earliest acquisition date',()=>{
  const rows=robinhoodHistoricalNfts({[wallet]:[{...transfer,time:1794100000},{...transfer,time:1794000000}]},[{address:wallet,name:'Robinhood'}]);
  assert.equal(rows.length,1);
  assert.equal(rows[0].firstReceived,1794000000);
  assert.equal(rows[0].image,image);
  assert.equal(rows[0].chain,'robinhood');
});

test('owned Robinhood NFT merges with history without replacing Ethereum asset',()=>{
  const rows=mergeHistoricalNfts([
    {id:`ethereum:1:${contract}:9743`,name:'Ethereum NFT',raw:'0',firstReceived:null,chain:'ethereum'},
    ...robinhoodHistoricalNfts({[wallet]:[transfer]},[{address:wallet,name:'Robinhood'}])
  ],[{id,chain:'robinhood',standard:'ERC-721',name:'TMO: INITIATES',symbol:'',raw:'1',decimals:0,image,explorer:null,wallets:['Robinhood']}]);
  assert.equal(rows.length,2);
  assert.equal(rows.find(row=>row.id===id)?.image,image);
  assert.equal(rows.find(row=>row.id===id)?.firstReceived,1794000000);
});
