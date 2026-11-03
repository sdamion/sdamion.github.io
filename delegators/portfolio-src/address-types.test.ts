import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addressType,addressTypeLabel,addressTypeChange,sourceTypeFields} from './address-types.ts';
import {nativeAddressRows,type NativeAddressBook} from './native-addresses.ts';
import {cardanoAddressRows,type CardanoAddressBook} from './cardano-addresses.ts';
import {bitcoinWallets} from './bitcoin.ts';
import {ethereumWallets} from './ethereum.ts';
import {nativeWallets} from './solana.ts';
import {normalizeCexAddresses} from './cex.ts';
import {isRewardSource} from './reward-sources.ts';

test('four address types preserve legacy flags and never automatically enable OUT',()=>{
  assert.equal(addressType({miner:true}),'min');assert.equal(addressType({miner:true,sourceType:'svc'}),'svc');assert.equal(addressType({dex:true}),'dex');assert.equal(addressType({}),'cex');
  for(const type of ['min','svc'] as const){const value={out:true,name:'Name',address:'original',...addressTypeChange(type)};assert.equal(value.out,false);assert.equal(value.miner,true);assert.equal(value.sourceType,type);assert.equal(value.address,'original');assert.equal(isRewardSource('original',[value]),true);
    for(const next of ['dex','cex'] as const){const changed={...value,...addressTypeChange(next)};assert.equal(changed.out,false);assert.equal(changed.miner,false);assert.equal(changed.sourceType,undefined);assert.equal(addressType(changed),next);}
  }
  assert.deepEqual(sourceTypeFields({miner:false,sourceType:'svc'}),{});assert.deepEqual(sourceTypeFields({miner:true,sourceType:'invalid'}),{});
});
for(const [network,address,normalize]of [
  ['cardano','stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',normalizeCexAddresses],
  ['ethereum','0x'+'1'.repeat(40),ethereumWallets],
  ['solana','11111111111111111111111111111111',nativeWallets],
  ['bitcoin','1BoatSLRHtKNngkdXEeobR76b53LETtpyT',bitcoinWallets]
] as const){
  test(`${network} type actions persist and restore all four roles without changing identity`,()=>{
    const book={network,enabled:true,exchanges:[{address,name:'Saved name',dex:true,out:true}],wallets:[],balance:()=>undefined,usd:null,snapshot:null,memberStake:'primary',busy:false,onView:()=>{},saveWallets:()=>true,saveExchanges:next=>{book.exchanges=normalize(JSON.parse(JSON.stringify(next)));return true;}} as unknown as NativeAddressBook&CardanoAddressBook;
    const rows=()=>network==='cardano'?cardanoAddressRows(book):nativeAddressRows(book);
    for(const type of ['min','svc','dex','cex'] as const){assert.equal(rows()[0].onType!(type),true);const restored=rows()[0];assert.equal(restored.addressType,type);assert.equal(restored.kind,addressTypeLabel(book.exchanges[0]));assert.equal(restored.kind,{min:'Mining',svc:'Service',dex:'DEX',cex:'CEX'}[type]);assert.equal(restored.address,address);assert.equal(restored.name,'Saved name');assert.equal(book.exchanges[0].out,false);}
    const before=JSON.stringify(book.exchanges);book.saveExchanges=()=>false;assert.equal(rows()[0].onType!('svc'),false);assert.equal(JSON.stringify(book.exchanges),before);
  });
}
test('owned and Swap rows have no role conversion actions; ETH source changes stop incompatible deposit scanning',()=>{
  const book:NativeAddressBook={network:'ethereum',enabled:true,wallets:[{address:'own',name:'Own'},{address:'swap',name:'Swap',group:'swap'}],exchanges:[{address:'deposit',name:'Deposit',deposit:true}],balance:()=>undefined,usd:null,saveWallets:()=>true,saveExchanges:next=>{book.exchanges=next;return true;}};
  assert.equal(nativeAddressRows(book,true)[0].onType,undefined);assert.equal(nativeAddressRows(book).find(row=>row.kind==='Swap')!.onType,undefined);
  nativeAddressRows(book)[0].onType!('svc');assert.equal(book.exchanges[0].deposit,false);assert.equal(book.exchanges[0].miner,true);assert.equal(book.exchanges[0].sourceType,'svc');
});
test('existing personal exchange targets can move to owned wallets with one shared role model',()=>{
  const address='0x'+'1'.repeat(40);
  const book:NativeAddressBook={network:'ethereum',enabled:true,wallets:[],exchanges:[{address,name:'My deposit',dex:true,deposit:true,in:true,out:false}],balance:()=> '1000000000000000000',usd:100,
    saveWallets:rows=>{book.wallets=ethereumWallets(rows);return true;},saveExchanges:rows=>{book.exchanges=ethereumWallets(rows);return true;}};
  const saved=nativeAddressRows(book)[0];
  assert.equal(saved.onMakeOwn!(),true);
  assert.equal(book.exchanges.length,0);
  const owned=nativeAddressRows(book,true)[0];
  assert.equal(owned.name,'My deposit');assert.equal(owned.kind,'Personal DEX wallet');
  assert.equal(owned.balance?.raw,'1000000000000000000');
  assert.equal(owned.onPersonalType!(undefined),true);
  assert.equal(nativeAddressRows(book,true)[0].kind,undefined);
});
