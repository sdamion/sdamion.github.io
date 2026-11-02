import {test} from 'node:test';
import assert from 'node:assert/strict';
import {depositAddresses,depositScanWallets,depositReceipt} from './deposit-tracking.ts';
import {bitcoinWallets,bitcoinDeposit,visibleBitcoinTransactions,bitcoinTransfers,bitcoinTotals,emptyBitcoin,type BitcoinTransaction} from './bitcoin.ts';
import {nativeWallets,solanaDeposit,visibleSolanaTransactions,solanaTransfers,solanaTotals,type SolanaTransaction} from './solana.ts';
import {ethereumWallets,ethereumDeposit} from './ethereum.ts';
import {normalizeCexAddresses} from './cex.ts';
import {cardanoAddressRows,type CardanoAddressBook} from './cardano-addresses.ts';
import {cardanoDepositReceipts,encodeCardanoDeposits,readCardanoDeposits,scanCardanoDeposits} from './cardano-deposits.ts';
import type {Detail} from './core.ts';
const own=[{address:'own',name:'Own'}],watched=[{address:'cex',name:'My deposit',deposit:true}],tip='a'.repeat(64);
test('one opt-in selector excludes owned, Swap and source addresses without mutating settings',()=>{
 const wallets=[...own,{address:'swap',name:'Swap',group:'swap' as const}],exchanges=[...watched,{...own[0],deposit:true},{address:'swap',name:'Swap',deposit:true},{address:'legacy',name:'Legacy',out:true},{address:'pool',name:'Pool',deposit:true,miner:true}];
 const before=JSON.stringify({wallets,exchanges});assert.deepEqual(depositAddresses(wallets,exchanges),watched);
 assert.deepEqual(depositScanWallets(wallets,exchanges),[{...own[0],deposit:false},...watched]);assert.equal(JSON.stringify({wallets,exchanges}),before);
 for(const [normalize,address]of [[bitcoinWallets,'1BoatSLRHtKNngkdXEeobR76b53LETtpyT'],[nativeWallets,'11111111111111111111111111111111'],[ethereumWallets,'0x'+'a'.repeat(40)],[normalizeCexAddresses,'stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel']] as const)assert.equal(normalize([{address,name:'Deposit',deposit:true}])[0].deposit,true);
});
test('standalone BTC deposits retain exact outputs and never become holdings, fees or CEX P/L',()=>{
 const receipt:BitcoinTransaction={hash:'1'.repeat(64),height:1,time:1700000000,feeRaw:'1000',inputs:[{address:'shared',raw:'123457789'}],outputs:[{address:'cex',raw:'123456789'}]},sweep={...receipt,hash:'2'.repeat(64),inputs:[{address:'cex',raw:'123456789'}],outputs:[{address:'hot',raw:'123455789'}]},transfer={...receipt,hash:'3'.repeat(64),inputs:[{address:'own',raw:'123457789'}]};
 const data={...emptyBitcoin(),usd:100000,accounts:{own:{raw:'0',tip,transactions:[transfer]},cex:{raw:'9999999999',tip,transactions:[receipt,sweep,transfer]}}},before=JSON.stringify(data);
 assert.equal(bitcoinDeposit(receipt,own,watched)?.raw,'123456789');assert.equal(bitcoinDeposit(sweep,own,watched),null);assert.equal(bitcoinDeposit(transfer,own,watched),null);
 assert.deepEqual(visibleBitcoinTransactions(data,own,watched).map(tx=>tx.hash).sort(),[receipt.hash,transfer.hash]);assert.deepEqual(visibleBitcoinTransactions(data,[],watched).map(tx=>tx.hash).sort(),[receipt.hash,transfer.hash]);
 assert.equal(bitcoinTotals(data,[]).value,0);assert.equal(bitcoinTotals(data,own).value,0);assert.equal(bitcoinTotals(data,[]).fees,0);assert.deepEqual(bitcoinTransfers(data,[],watched),[]);assert.equal(bitcoinTransfers(data,own,watched).length,1);assert.equal(JSON.stringify(data),before);
 assert.equal(bitcoinDeposit(receipt,[],[{...watched[0],deposit:false}]),null);
});
test('SOL and ETH share direct-deposit rules and suppress failures, exchange forwarding and self-transfers',()=>{
 const tx:SolanaTransaction={hash:'sol',slot:1,time:1700000000,payer:'shared',feeRaw:'5000',failed:false,transfers:[{from:'shared',to:'cex',raw:'1234567891'}]},sweep={...tx,hash:'sweep',transfers:[{from:'cex',to:'hot',raw:'1234562891'}]};
 const data={accounts:{cex:{raw:'99999999999',slot:1,checkpoint:null,transactions:[tx,sweep]}},history:{},usd:100},before=JSON.stringify(data);
 assert.equal(solanaDeposit(tx,[],watched)?.raw,'1234567891');assert.equal(solanaDeposit({...tx,failed:true},[],watched),null);assert.deepEqual(visibleSolanaTransactions(data,[],watched),[tx]);assert.deepEqual(solanaTransfers(data,[],watched),[]);assert.equal(solanaTotals(data,[]).value,0);assert.equal(solanaTotals(data,[]).fees,0);assert.equal(JSON.stringify(data),before);
 const eth={id:'eth',hash:'0x'+'1'.repeat(64),kind:'normal' as const,block:1,time:1700000000,from:'shared',to:'cex',valueWei:'1234567890123456789',feeWei:'1',failed:false};
 assert.equal(ethereumDeposit(eth,[],watched)?.raw,eth.valueWei);assert.equal(ethereumDeposit({...eth,from:'cex'},[],watched),null);assert.equal(ethereumDeposit({...eth,failed:true},[],watched),null);
 assert.equal(depositReceipt('ethereum',eth.hash,eth.time,[{address:'shared',raw:'1'}],[{address:'cex',raw:'1'}],[{address:'cex',name:'Owned'}],watched),null);
 const other={address:'other',name:'Other deposit',deposit:true};assert.equal(ethereumDeposit({...eth,from:'other'},[],[...watched,other]),null);
});
const address='addr1q99u68080mhnj34s78e5f2jwgarl342aj70jkleffze93k4l7csm4qlkawkyf9j34kh7sljq8d0mqn8kjypxrs38g78qqvfkfn',stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const detail:Detail={tx_hash:'b'.repeat(64),tx_timestamp:1700000000,fee:'123',inputs:[{value:'1000123',payment_addr:{bech32:'addr1shared'}}],outputs:[{value:'1000000',payment_addr:{bech32:address}}]};
test('Cardano deposit cache is separate, chunked, validated and reclassified against current ownership',()=>{
 const data={scope:[address,stake].sort().join('|'),checkedAt:1,groups:{[stake]:[address],[address]:[address]},details:[detail]},targets=[{address:stake,name:'Stake deposit',deposit:true},{address,name:'Same payment',deposit:true}],before=JSON.stringify(data);
 const rows=cardanoDepositReceipts(data,targets,[],new Set());assert.equal(rows.length,1);assert.equal(rows[0].raw,'1000000','overlapping stake/payment labels never double-count an output');
 assert.deepEqual(cardanoDepositReceipts(data,targets,[],new Set([detail.tx_hash])),[]);assert.deepEqual(cardanoDepositReceipts(data,targets,['addr1shared'],new Set()),[]);
 const key='tdsp-member-cardano-deposits:member',encoded=encodeCardanoDeposits(key,data);assert.deepEqual(readCardanoDeposits(key,name=>encoded[name]??null),data);delete encoded[key+'::0'];assert.throws(()=>readCardanoDeposits(key,name=>encoded[name]??null));assert.equal(JSON.stringify(data),before);
 const book:CardanoAddressBook={wallets:[],exchanges:[{address,name:'CEX'}],snapshot:null,memberStake:stake,busy:false,usd:null,onView:()=>{},saveWallets:()=>{throw Error('Not owned');},saveExchanges:rows=>{book.exchanges=rows;return true;}};
 assert.equal(cardanoAddressRows(book)[0].onDeposit!(true),true);assert.equal(book.exchanges[0].deposit,true);assert.equal(cardanoAddressRows(book)[0].onMining,undefined);assert.equal(cardanoAddressRows(book,true).length,0);
 cardanoAddressRows(book)[0].onType!('min');assert.equal(book.exchanges[0].deposit,false);
});
test('Cardano scanner resolves stake aliases, completes details and rejects incomplete or unrelated responses',async()=>{
 const calls:string[]=[];
 const fetcher=async(_path:string,options:RequestInit)=>{
  const {path}=JSON.parse(String(options.body));calls.push(path);
  return new Response(JSON.stringify(path==='account_addresses'?[{stake_address:stake,addresses:[address]}]:path==='address_txs'?[{tx_hash:detail.tx_hash,block_time:detail.tx_timestamp,block_height:1}]:[detail]));
 };
 const targets=[{address:stake,name:'CEX',deposit:true}],scanned=await scanCardanoDeposits(targets,fetcher,new AbortController().signal);
 assert.deepEqual(scanned.details,[detail]);assert.deepEqual(calls,['account_addresses','address_txs','tx_info']);assert.equal(cardanoDepositReceipts(scanned,targets,[],new Set()).length,1);
 await assert.rejects(scanCardanoDeposits(targets,async(path,options)=>JSON.parse(String(options.body)).path==='tx_info'?new Response('[]'):fetcher(path,options),new AbortController().signal),/unavailable/);
 const control=new AbortController();control.abort();await assert.rejects(scanCardanoDeposits(targets,fetcher,control.signal));
});
