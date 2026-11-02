import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bech32,bech32m} from '@scure/base';
import {validBitcoinAddress,normalizeBitcoinAddress,bitcoinWallets,bitcoinTransfer,bitcoinTransactions,bitcoinTotals,bitcoinTransfers,bitcoinFee,bitcoinAmountText,emptyBitcoin,type BitcoinTransaction} from './bitcoin.ts';
import {encodeBitcoinSettings,readBitcoinSettings} from './bitcoin-storage.ts';
import {portfolioTransactionCounts} from './transaction-counts.ts';
const address='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',exchange='1BitcoinEaterAddressDontSendf59kuE',other='1CounterpartyXXXXXXXXXXXXXXXUWLpVr';
const own=[{address,name:'Owned'}],cex=[{address:exchange,name:'Exchange'}],tip='a'.repeat(64);
const tx=(overrides:Partial<BitcoinTransaction>={}):BitcoinTransaction=>({hash:'1'.repeat(64),height:1,time:1700000000,feeRaw:'100',inputs:[{address:exchange,raw:'1000'}],outputs:[{address,raw:'900'}],...overrides});
test('Bitcoin mainnet addresses require valid Base58Check/Bech32/Bech32m and preserve legacy case',()=>{
  for(const value of [address,exchange,other])assert.ok(validBitcoinAddress(value));
  const witness=bech32.encode('bc',[0,...bech32.toWords(new Uint8Array(20).fill(1))]);
  const taproot=bech32m.encode('bc',[1,...bech32m.toWords(new Uint8Array(32).fill(2))]);
  for(const value of [witness,taproot]){assert.ok(validBitcoinAddress(value));assert.ok(validBitcoinAddress(value.toUpperCase()));assert.equal(normalizeBitcoinAddress(value.toUpperCase()),value);}
  for(const value of [address.toLowerCase(),address.slice(0,-1)+'x',bech32.encode('tb',[0,...bech32.toWords(new Uint8Array(20))]),bech32.encode('bc',[1,...bech32.toWords(new Uint8Array(32))]),'bC'+witness.slice(2),'https://example.com','xpub123'])assert.equal(validBitcoinAddress(value),false,value);
  assert.equal(bitcoinWallets([{address,name:'  Name  ',miner:true}])[0].name,'Name');
});
test('CEX directions use owned BTC perspective and exclude change, internal transfers and ambiguous inputs',()=>{
  assert.deepEqual(bitcoinTransfer(tx(),own,cex),{side:'buy',raw:'900'});
  const outgoing=tx({inputs:[{address,raw:'1000'}],outputs:[{address:exchange,raw:'600'},{address,raw:'300'}]});
  assert.deepEqual(bitcoinTransfer(outgoing,own,cex),{side:'sell',raw:'600'});
  assert.equal(bitcoinTransfer(outgoing,[...own,...cex],cex),null);
  assert.equal(bitcoinTransfer(tx({inputs:[{address:exchange,raw:'500'},{address:other,raw:'500'}]}),own,cex),null);
  assert.equal(bitcoinTransfer(tx({inputs:[{address:other,raw:'1000'}]}),own,cex),null);
  assert.deepEqual(bitcoinTransfer(tx(),own,[{...cex[0],miner:true}]),{side:'sell',raw:'900',mined:true});
  const miningData=emptyBitcoin();miningData.accounts[address]={raw:'900',tip,transactions:[tx()]};
  assert.equal(bitcoinTransfers(miningData,own,[{...cex[0],miner:true}])[0].performance,false,'mining receipts never become CEX sale proceeds');
});
test('deduplication, confirmed holdings, satoshi fees, missing prices and encrypted cache parts',()=>{
  const data=emptyBitcoin(),receipt=tx(),send=tx({hash:'2'.repeat(64),inputs:[{address,raw:'900'}],outputs:[{address:exchange,raw:'600'},{address,raw:'200'}]});
  data.accounts[address]={raw:'200',tip,transactions:[receipt,send]};data.usd=100000;data.history['2023-11-14']=100000;
  data.accounts[exchange]={raw:'99999',tip,transactions:[receipt]};
  assert.equal(bitcoinTransactions(data,own).length,2);
  assert.ok(Math.abs(bitcoinTotals(data,own).value!-0.2)<1e-12);assert.equal(bitcoinTotals(data,own).fees,0.000001);
  assert.deepEqual(bitcoinTransfers(data,own,cex).map(row=>row.side).sort(),['buy','sell']);
  data.usd=null;assert.equal(bitcoinTotals(data,own).value,null);
  const key='tdsp-member-bitcoin-data:member',settings=encodeBitcoinSettings(key,data);
  assert.deepEqual(readBitcoinSettings(key,name=>settings[name]??null),data);
  settings['tdsp-member-bitcoin-wallets:member']=JSON.stringify(own);
  assert.equal(portfolioTransactionCounts({settings,snapshot:null},'member').saved,2);
  delete settings[key+'::'+address+':0'];assert.throws(()=>readBitcoinSettings(key,name=>settings[name]??null));
});
test('total on-chain fees stay visible on incoming and mixed transactions without claiming wallet ownership',()=>{
  const receipt=tx({feeRaw:'1'}),outgoing=tx({hash:'2'.repeat(64),feeRaw:'123456',inputs:[{address,raw:'200000'}],outputs:[{address:exchange,raw:'76544'}]}),mixed=tx({hash:'3'.repeat(64),feeRaw:'1000',inputs:[{address,raw:'1000'},{address:other,raw:'1000'}],outputs:[{address:exchange,raw:'1000'}]});
  const before=JSON.stringify([receipt,outgoing,mixed]);
  assert.deepEqual(bitcoinFee(receipt,own),{totalRaw:'1',paidRaw:'0',payer:'external'});
  assert.deepEqual(bitcoinFee(outgoing,own),{totalRaw:'123456',paidRaw:'123456',payer:'own'});
  assert.deepEqual(bitcoinFee(mixed,own),{totalRaw:'1000',paidRaw:null,payer:'mixed'});
  assert.equal(bitcoinAmountText('1'),'0.00000001');assert.equal(bitcoinAmountText('123456'),'0.00123456');
  const data=emptyBitcoin();data.accounts[address]={raw:'0',tip,transactions:[receipt,outgoing,mixed,outgoing]};
  const totals=bitcoinTotals(data,own);assert.equal(totals.feesRaw,'123456');assert.equal(totals.feesPartial,true);assert.equal(totals.unattributedFees,1);assert.equal(totals.feeUsd,null);
  const missing=bitcoinTotals(data,[...own,{address:other,name:'Not loaded'}]);assert.equal(missing.feesPartial,true);assert.notEqual(missing.feesRaw,null,'known paid fees survive a missing wallet');
  assert.equal(bitcoinTotals(emptyBitcoin(),own).feesRaw,null,'no downloaded history is not zero fees');
  assert.equal(JSON.stringify([receipt,outgoing,mixed]),before);
});
