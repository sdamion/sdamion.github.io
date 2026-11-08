import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addNativeAddress,nativeAddressRows,type NativeAddressBook} from './native-addresses.ts';
import type {NativeAddressNetwork} from './address-networks.ts';
import {bitcoinWallets} from './bitcoin.ts';
import {ethereumWallets} from './ethereum.ts';
import {nativeWallets} from './solana.ts';
import {normalizeCexAddresses} from './cex.ts';

function fixture(network:NativeAddressNetwork){
  const book:NativeAddressBook={network,enabled:true,wallets:[],exchanges:[],balance:()=>undefined,usd:null,
    saveWallets:next=>{book.wallets=next;return true;},saveExchanges:next=>{book.exchanges=next;return true;}};
  return book;
}
for(const network of ['ethereum','robinhood','solana','bitcoin'] as const){
  test(`${network} shares own/DEX/CEX actions and preserves metadata and address identity`,()=>{
    const book=fixture(network);
    assert.equal(addNativeAddress(book,false,'exchange','Own','own'),true);
    assert.equal(addNativeAddress(book,true,'dex','Dex','dex'),true);
    assert.equal(addNativeAddress(book,true,'exchange','Cex','cex'),true);
    assert.throws(()=>addNativeAddress(book,true,'exchange','Duplicate','own'),/own wallet/);
    assert.throws(()=>addNativeAddress(book,false,'exchange','Duplicate','cex'),/already saved/);
    assert.equal(book.wallets.length,1);assert.equal(book.exchanges.length,2);
    let rows=nativeAddressRows(book);assert.deepEqual(rows.map(row=>row.kind),['DEX','CEX']);
    assert.equal(rows[0].onRename('Renamed'),true);assert.equal(book.exchanges[0].address,'dex');assert.equal(book.exchanges[0].dex,true);
    rows=nativeAddressRows(book);assert.equal(rows[0].onMining!(true),true);
    rows=nativeAddressRows(book);assert.equal(rows[0].miner,true);assert.equal(rows[0].out,false);
    assert.equal(rows[0].onOut!(true),true);
    rows=nativeAddressRows(book);assert.equal(rows[0].miner,false);assert.equal(rows[0].out,true);assert.equal(rows[0].name,'Renamed');
    assert.equal(rows[0].onRemove(),true);assert.equal(book.exchanges.length,1);assert.equal(book.exchanges[0].address,'cex');assert.equal(book.wallets[0].address,'own');
    const own=nativeAddressRows(book,true)[0];assert.equal(own.balance?.raw,null);assert.equal(own.onMining,undefined);assert.equal(own.onOut,undefined);
  });
  test(`${network} permissions and rejected saves fail without mutating existing rows`,()=>{
    const book=fixture(network);book.enabled=false;
    assert.equal(addNativeAddress(book,true,'dex','Denied','dex'),false);assert.deepEqual(nativeAddressRows(book),[]);
    book.enabled=true;book.exchanges=[{address:'saved',name:'Saved',out:true,dex:true,miner:false}];
    const before=JSON.stringify(book.exchanges);book.saveExchanges=()=>false;
    assert.equal(nativeAddressRows(book)[0].onRename('Rejected'),false);assert.equal(JSON.stringify(book.exchanges),before);
    assert.equal(addNativeAddress(book,true,'dex','Rejected','new'),false);assert.equal(JSON.stringify(book.exchanges),before);
  });
  test(`${network} adds standalone OUT counterparties without creating an owned wallet`,()=>{
    const book=fixture(network);
    assert.equal(addNativeAddress(book,true,'exchange','OUT only','destination',true),true);
    assert.deepEqual(book.exchanges,[{address:'destination',name:'OUT only',out:true}]);
    assert.deepEqual(book.wallets,[]);assert.equal(nativeAddressRows(book)[0].out,true);
    assert.equal(nativeAddressRows(book)[0].balance,undefined);
    assert.equal(addNativeAddress(book,true,'exchange','Not OUT','other',false),true);
    assert.equal(book.exchanges[1].out,false);
    assert.equal(addNativeAddress(book,false,'exchange','Owned','own',true),true);
    assert.equal(book.wallets[0].out,undefined,'own wallets never inherit the counterparty flag');
    if(network==='ethereum'||network==='robinhood'){
      assert.equal(addNativeAddress(book,true,'swap','Swap','swap',true),true);
      assert.equal(book.wallets[1].out,undefined,'Swap wallets never inherit the counterparty flag');
    }
  });
}
test('all native chains support deposit tracking while Swap remains ETH-only',()=>{
  const eth=fixture('ethereum');addNativeAddress(eth,false,'exchange','Own','own');
  addNativeAddress(eth,true,'swap','Swap','swap');addNativeAddress(eth,true,'exchange','Deposit','deposit');
  const swap=nativeAddressRows(eth).find(row=>row.kind==='Swap')!;assert.equal(swap.onMining,undefined);assert.equal(swap.onOut,undefined);
  swap.onRename('Renamed Swap');assert.equal(eth.wallets[0].address,'own');assert.equal(eth.wallets[1].group,'swap');
  nativeAddressRows(eth).find(row=>row.address==='deposit')!.onDeposit!(true);
  assert.equal(eth.exchanges[0].deposit,true);assert.equal(nativeAddressRows(eth).find(row=>row.address==='deposit')!.onMining,undefined);
  for(const network of ['bitcoin','solana'] as const){const book=fixture(network);assert.equal(addNativeAddress(book,true,'swap','Unsupported','swap'),false);assert.deepEqual(book.wallets,[]);addNativeAddress(book,true,'exchange','External','external');assert.equal(nativeAddressRows(book)[0].onDeposit!(true),true);assert.equal(book.exchanges[0].deposit,true);assert.equal(nativeAddressRows(book)[0].onMining,undefined);assert.deepEqual(book.wallets,[]);}
});
test('Robinhood and Ethereum can save the same EVM address independently',()=>{
  const eth=fixture('ethereum'),rh=fixture('robinhood'),address='0x'+'1'.repeat(40);
  eth.balance=()=> '1000000000000000000';rh.balance=()=> '2000000000000000000';
  assert.equal(addNativeAddress(eth,false,'exchange','ETH wallet',address),true);
  assert.equal(addNativeAddress(rh,false,'exchange','RH wallet',address),true);
  assert.throws(()=>addNativeAddress(rh,false,'exchange','Duplicate',address),/already saved/);
  assert.equal(nativeAddressRows(eth,true)[0].network,'ethereum');
  assert.equal(nativeAddressRows(rh,true)[0].network,'robinhood');
  assert.equal(nativeAddressRows(eth,true)[0].balance?.raw,'1000000000000000000');
  assert.equal(nativeAddressRows(rh,true)[0].balance?.raw,'2000000000000000000');
  assert.equal(nativeAddressRows(rh,true)[0].onRename('RH renamed'),true);
  assert.equal(eth.wallets[0].name,'ETH wallet');
});
test('shared limits preserve existing ETH/SOL limits and do not impose one on BTC',()=>{
  for(const network of ['ethereum','robinhood','solana','bitcoin'] as const){const book=fixture(network);book.wallets=Array.from({length:20},(_,i)=>({address:String(i),name:String(i)}));if(network==='bitcoin')assert.equal(addNativeAddress(book,false,'exchange','More','more'),true);else assert.throws(()=>addNativeAddress(book,false,'exchange','More','more'));}
});
test('DEX labels survive all chain settings normalizers without changing addresses or OUT metadata',()=>{
  const btc='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',eth='0x'+'1'.repeat(40),sol='11111111111111111111111111111111',ada='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
  for(const [normalize,address]of [[bitcoinWallets,btc],[ethereumWallets,eth],[nativeWallets,sol],[normalizeCexAddresses,ada]] as const){
    const saved=JSON.parse(JSON.stringify([{address,name:'DEX',dex:true,out:false,miner:true}]));
    assert.deepEqual(normalize(saved),saved);
  }
  assert.deepEqual(normalizeCexAddresses([{address:ada,name:'Legacy'}]),[{address:ada,name:'Legacy'}]);
});
