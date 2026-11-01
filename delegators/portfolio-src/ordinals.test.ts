import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyOrdinals,ordinalHistory,ordinalImage,ordinalFrame,validOrdinalMetadata,type OrdinalMetadata} from './ordinals.ts';
import {emptyBitcoin,type BitcoinTransaction} from './bitcoin.ts';
import {encodeOrdinalsSettings,readOrdinalsSettings} from './ordinals-storage.ts';
import {filterNftCollage,nftCollections} from './nft-collage.ts';
const address='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',other='1BitcoinEaterAddressDontSendf59kuE',tip='f'.repeat(64),id='a'.repeat(64)+'i0',held='d'.repeat(64)+'i1';
const receipt:BitcoinTransaction={hash:'b'.repeat(64),height:1,time:1700000000,feeRaw:'100',inputs:[{address:other,raw:'1000'}],outputs:[{address,raw:'900'}]};
const sent:BitcoinTransaction={hash:'c'.repeat(64),height:2,time:1700000100,feeRaw:'100',inputs:[{address,raw:'900'}],outputs:[{address:other,raw:'800'}]};
const ownedTx={...receipt,hash:'e'.repeat(64),height:3,time:1700000200};
const metadata=(inscription=id):OrdinalMetadata=>({id:inscription,number:123,contentType:'image/png',owner:other,ownerOutput:sent.hash+':0',created:1600000000,genesisAddress:other,name:'An Ordinal',collection:'example-art'});
function fixture(){
  const data=emptyOrdinals(),bitcoin=emptyBitcoin();
  bitcoin.accounts[address]={tip,raw:'900',transactions:[receipt,sent,ownedTx]};
  data.metadata[id]=metadata();data.metadata[held]={...metadata(held),number:456,owner:address,ownerOutput:ownedTx.hash+':0',name:'Owned artwork'};
  data.accounts[address]={tip,checkedAt:Date.now(),owned:[data.metadata[held]],events:[{id,hash:receipt.hash,side:'receive',confirmed:true,time:1699999000},{id,hash:sent.hash,side:'send',confirmed:true,time:1700000100},{id:held,hash:ownedTx.hash,side:'receive',confirmed:true,time:1700000200}]};
  return {data,bitcoin};
}
test('historical Ordinals retain sent inscriptions, use verified receipt times and separate namespaced collections',()=>{
  const {data,bitcoin}=fixture(),result=ordinalHistory(data,bitcoin,[{address,name:'BTC Savings'}]);
  assert.equal(result.rows.length,2);const sold=result.rows.find(row=>row.ordinal?.id===id)!;
  assert.equal(sold.raw,'0');assert.equal(sold.firstReceived,receipt.time,'creation time is not substituted for receipt time');
  const current=result.rows.find(row=>row.ordinal?.id===held)!;assert.equal(current.raw,'1');assert.deepEqual(current.ordinal!.ownedWallets,['BTC Savings']);
  assert.equal(filterNftCollage(result.rows,{},result.wallets,'BTC Savings','','date').length,2);
  assert.equal(nftCollections(result.rows)[0].policy,'bitcoin:ordinals:example-art');
  assert.equal(filterNftCollage(result.rows,{},result.wallets,'','bitcoin:ordinals:example-art','buy-high').length,2);
  assert.equal(bitcoin.accounts[address].raw,'900','NFT display never changes native BTC values');
});
test('unconfirmed, orphaned and unrelated transfers cannot manufacture NFT ownership',()=>{
  const {data,bitcoin}=fixture();
  data.accounts[address].events.push({id:'9'.repeat(64)+'i0',hash:receipt.hash,side:'receive',confirmed:false,time:null},{id:'8'.repeat(64)+'i0',hash:'7'.repeat(64),side:'receive',confirmed:true,time:1700000000});
  assert.equal(ordinalHistory(data,bitcoin,[{address,name:'BTC'}]).rows.length,2);
  bitcoin.accounts[address].tip='1'.repeat(64);assert.ok(ordinalHistory(data,bitcoin,[{address,name:'BTC'}]).rows.every(row=>row.raw==='0'),'stale Ordinals checkpoints do not assert current ownership');
  bitcoin.accounts[address].transactions=[];assert.equal(ordinalHistory(data,bitcoin,[{address,name:'BTC'}]).rows.length,0);
  assert.equal(ordinalHistory(data,bitcoin,[]).rows.length,0,'removed wallets and CEX-only addresses do not enter the gallery');
});
test('only fixed raster inscription URLs are rendered; cache parts round-trip losslessly',()=>{
  assert.equal(ordinalImage(id,'image/png'),'https://ordiscan.com/content/'+id);
  for(const type of ['image/svg+xml','text/html','application/javascript','application/json',null])assert.equal(ordinalImage(id,type),null);
  assert.equal(ordinalImage('javascript:alert(1)','image/png'),null);assert.equal(validOrdinalMetadata({...metadata(),ownerOutput:'bad'}),false);
  const recursive='af4caa26e26ddb6f7ffc150b9cda93c85c327d5bcff28ff976caf7f167d6d220i129';
  assert.equal(ordinalFrame(recursive,'text/html'),'https://ordiscan.com/content/'+recursive);
  for(const value of ['javascript:alert(1)','https://evil.example/','../index.html',recursive+'?x=1'])assert.equal(ordinalFrame(value,'text/html'),null);
  for(const type of ['image/svg+xml','application/javascript',null])assert.equal(ordinalFrame(recursive,type),null);
  const {data}=fixture(),key='tdsp-member-bitcoin-ordinals:member',settings=encodeOrdinalsSettings(key,data);
  assert.deepEqual(readOrdinalsSettings(key,name=>settings[name]??null),data);
  delete settings[key+'::'+address+':events:0'];assert.throws(()=>readOrdinalsSettings(key,name=>settings[name]??null));
});
test('large Ordinal histories use multiple lossless encrypted-cache parts',()=>{
  const {data}=fixture(),key='tdsp-member-bitcoin-ordinals:member';
  data.accounts[address].events=Array.from({length:10001},(_,index)=>({id,hash:(index+1).toString(16).padStart(64,'0'),side:'receive' as const,confirmed:true,time:1700000000+index}));
  const settings=encodeOrdinalsSettings(key,data);assert.ok(settings[key+'::'+address+':events:1']);
  assert.deepEqual(readOrdinalsSettings(key,name=>settings[name]??null),data);
});
