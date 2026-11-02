import test from 'node:test';
import assert from 'node:assert/strict';
import {isOutAddress} from './out-address.ts';
import {ethereumTransfer,ethereumWallets,weiToEthText,visibleEthereumTransactions,ethereumValue,emptyEthereum,type EthereumTransaction} from './ethereum.ts';
import {normalizeCexAddresses,cexAdaTransfer} from './cex.ts';
import {solanaTransfers,nativeWallets} from './solana.ts';
import {bitcoinTransfer,bitcoinWallets} from './bitcoin.ts';
const own='0x'+'a'.repeat(40),target='0x'+'b'.repeat(40),pool='0x'+'c'.repeat(40),wallet={address:own,name:'Own'},address={address:target,name:'My chosen destination'};
const eth: EthereumTransaction={id:'0x'+'1'.repeat(64)+':normal',hash:'0x'+'1'.repeat(64),kind:'normal',block:1,time:1700000000,from:own,to:target,valueWei:'1234567890123456789',feeWei:'123456789123456',failed:false};
test('OUT is an address choice, independent of its name, and never edits ETH blockchain values',()=>{
  const original=JSON.stringify(eth);
  assert.equal(ethereumTransfer(eth,[wallet],[{...address,out:false}]),null);
  assert.equal(ethereumTransfer(eth,[wallet],[{...address,out:true}])?.side,'sell');
  assert.equal(ethereumTransfer({...eth,from:target,to:own},[wallet],[{...address,out:true}])?.side,'buy');
  assert.equal(ethereumTransfer({...eth,to:own},[wallet],[{...address,address:own,out:true}]),null);
  assert.equal(JSON.stringify(eth),original);assert.equal(weiToEthText(eth.valueWei),'1.234567890123456789');assert.equal(weiToEthText(eth.feeWei!),'0.000123456789123456');
  assert.deepEqual(ethereumWallets([{...address,out:false}])[0],{...address,out:false});assert.equal(isOutAddress({...address,miner:true,out:true}),false);
});
test('ADA, SOL and BTC use the same chosen OUT flag without changing raw amounts or fees',()=>{
  const fact={hash:'ada',time:1700000000,adaRaw:'-1100000',feeRaw:'100000',assets:{},decimals:{},wallets:[],swapCandidate:false,internal:false,externalInputs:[],externalOutputs:[{address:'addr1cex',lovelace:'1000000'}]};
  const solTx={hash:'sol',time:1700000000,slot:1,payer:'own',feeRaw:'1',failed:false,transfers:[{from:'own',to:'cex',raw:'1234567890'}]};
  const sol={accounts:{own:{raw:'0',slot:1,checkpoint:null,transactions:[solTx]}},history:{},usd:null};
  const btcTx={hash:'b'.repeat(64),height:1,time:1700000000,feeRaw:'1',inputs:[{address:'own',raw:'101'}],outputs:[{address:'cex',raw:'100'}]};
  const original=JSON.stringify({fact,sol,btcTx});
  assert.equal(cexAdaTransfer(fact,[{address:'addr1cex',name:'Chosen',out:false}]),null);assert.equal(cexAdaTransfer(fact,[{address:'addr1cex',name:'Chosen',out:true}])?.raw,1000000n);
  assert.equal(solanaTransfers(sol,[{address:'own',name:'Own'}],[{address:'cex',name:'Chosen',out:false}]).length,0);assert.equal(solanaTransfers(sol,[{address:'own',name:'Own'}],[{address:'cex',name:'Chosen',out:true}]).length,1);
  assert.equal(bitcoinTransfer(btcTx,[{address:'own',name:'Own'}],[{address:'cex',name:'Chosen',out:false}]),null);assert.equal(bitcoinTransfer(btcTx,[{address:'own',name:'Own'}],[{address:'cex',name:'Chosen',out:true}])?.raw,'100');
  assert.equal(JSON.stringify({fact,sol,btcTx}),original);
  const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel',solAddress='So11111111111111111111111111111111111111112',btcAddress='1BoatSLRHtKNngkdXEeobR76b53LETtpyT';
  assert.equal(normalizeCexAddresses([{address:stake,name:'Chosen',out:false}])[0].out,false);assert.equal(nativeWallets([{address:solAddress,name:'Chosen',out:false}])[0].out,false);assert.equal(bitcoinWallets([{address:btcAddress,name:'Chosen',out:false}])[0].out,false);
});
test('personal ETH deposits preserve provider data, deduplicate transfers and exclude exchange sweeps/holdings',()=>{
  const receipt={...eth,id:'0x'+'2'.repeat(64)+':normal',hash:'0x'+'2'.repeat(64),from:pool,to:target},sweep={...eth,id:'0x'+'3'.repeat(64)+':normal',hash:'0x'+'3'.repeat(64),from:target,to:pool};
  const data={...emptyEthereum(),usd:1000,accounts:{[own]:{balanceWei:'1000000000000000000',block:1,transactions:[eth]},[target]:{balanceWei:'99000000000000000000',block:1,transactions:[receipt,eth,sweep]}}};
  const before=JSON.stringify(data),dest={...address,deposit:true,out:true};
  assert.equal(visibleEthereumTransactions(data,[wallet],[dest]).length,2);assert.equal(visibleEthereumTransactions(data,[wallet],[{...dest,deposit:false}]).length,1);assert.equal(ethereumValue(data,[wallet]),1000);assert.equal(JSON.stringify(data),before);
});
