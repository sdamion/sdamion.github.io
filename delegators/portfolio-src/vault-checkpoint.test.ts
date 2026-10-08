import assert from 'node:assert/strict';
import {prepareCheckpoint,restoreCheckpoint,checkCheckpointSize,CHECKPOINT_DECODED_LIMIT,type VaultData} from './vault-checkpoint.ts';
import {openVault} from './vault-crypto.ts';
import {portfolioTransactionCounts} from './transaction-counts.ts';
const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
assert.doesNotThrow(()=>checkCheckpointSize(101*1024*1024));
assert.doesNotThrow(()=>checkCheckpointSize(CHECKPOINT_DECODED_LIMIT));
assert.throws(()=>checkCheckpointSize(CHECKPOINT_DECODED_LIMIT+1),/512 MB/);
const a='a'.repeat(64),b='b'.repeat(64);
const data:VaultData={version:1,settings:{private:'secret'},snapshot:{key:stake+'::test',data:{infos:[],txs:[{tx_hash:a,block_time:1700000000},{tx_hash:b,block_time:1600000000}] as any,facts:{[a]:{fee:'123'}} as any,markets:{},adaUsd:1,history:{},updated:'now',complete:false,priceAt:null}}};
const wallet='0x'+'1'.repeat(40),other='0x'+'2'.repeat(40),orphan='0x'+'3'.repeat(40),hash='0x'+'c'.repeat(64);
const normal={id:hash+':normal',hash,kind:'normal',block:1,time:1700000000,from:wallet,to:other,valueWei:'1000000000000000000',feeWei:'123',failed:false};
const internal={...normal,id:hash+':0',kind:'internal',feeWei:null};
data.settings['tdsp-member-ethereum-wallets:'+stake]=JSON.stringify([{address:wallet,name:'ETH wallet',miner:true},{address:other,name:'Second wallet',group:'swap'}]);
data.settings['tdsp-member-ethereum-data:'+stake]=JSON.stringify({accounts:{
  [wallet]:{balanceWei:'0',block:1,transactions:[normal,internal]},
  [other]:{balanceWei:'0',block:1,transactions:[normal]},
  [orphan]:{balanceWei:'0',block:1,transactions:[{...normal,hash:'0x'+'d'.repeat(64),id:'0x'+'d'.repeat(64)+':normal'}]}
},history:{'2023-11-14':1200},usd:null,updated:null});
assert.deepEqual(portfolioTransactionCounts(data,stake),{saved:2,total:3,cardanoSaved:1});
assert.deepEqual(portfolioTransactionCounts({...data,snapshot:null},stake),{saved:1,total:1,cardanoSaved:0});
assert.deepEqual(portfolioTransactionCounts({...data,settings:{['tdsp-member-ethereum-data:'+stake]:'invalid JSON'}},stake),{saved:1,total:2,cardanoSaved:1});
const first=await prepareCheckpoint(data,key,stake,null);
assert.equal(first.saved,2);
assert.equal(first.total,3);
assert.equal(first.cardanoSaved,1);
assert.equal(first.chunks.length,2);
assert.deepEqual(await openVault(key,stake,first.payload),first.index);
const identical=await prepareCheckpoint(data,key,stake,first.index);
assert.equal(identical.chunks.length,0);
data.settings.private='new';
assert.equal((await prepareCheckpoint(data,key,stake,first.index)).chunks.length,0);
data.snapshot!.data.facts[b]={fee:'456'} as any;
const changed=await prepareCheckpoint(data,key,stake,first.index);
assert.equal(changed.chunks.length,1);
const rows=[...first.chunks,...changed.chunks];
const restored=await restoreCheckpoint(changed.index,key,stake,async ids=>rows.filter(row=>ids.includes(row.id)));
assert.deepEqual(restored,data);
assert.deepEqual(portfolioTransactionCounts(restored,stake),{saved:3,total:3,cardanoSaved:2});
await assert.rejects(restoreCheckpoint(changed.index,key,stake,async()=>[]),/incomplete/);
const tampered=structuredClone(changed.index);Object.values(tampered.buckets)[0].digest='0'.repeat(64);
await assert.rejects(restoreCheckpoint(tampered,key,stake,async ids=>rows.filter(row=>ids.includes(row.id))),/integrity/);
await assert.rejects(prepareCheckpoint(data,key,stake,null,AbortSignal.abort()),{name:'AbortError'});
const settingsData:VaultData={version:1,snapshot:null,settings:{
  private:'small',eth:'x'.repeat(5*1024*1024),futureToken:'日本語'.repeat(100000),unicodeBoundary:'x'.repeat(4*1024*1024-1)+'🚀',
}};
const settingsCheckpoint=await prepareCheckpoint(settingsData,key,stake,null);
assert.ok(settingsCheckpoint.chunks.length>=3);
assert.equal(settingsCheckpoint.index.meta.settings.eth,undefined);
const settingsRestored=await restoreCheckpoint(settingsCheckpoint.index,key,stake,async ids=>settingsCheckpoint.chunks.filter(row=>ids.includes(row.id)));
assert.deepEqual(settingsRestored,settingsData);
assert.equal((await prepareCheckpoint(settingsData,key,stake,settingsCheckpoint.index)).chunks.length,0);
settingsData.settings.private='only metadata changes';
assert.equal((await prepareCheckpoint(settingsData,key,stake,settingsCheckpoint.index)).chunks.length,0);
settingsData.settings.eth+='changed';
assert.equal((await prepareCheckpoint(settingsData,key,stake,settingsCheckpoint.index)).chunks.length,1);
const missingPart=structuredClone(settingsCheckpoint.index);
missingPart.settingParts!.eth.push('absent');
await assert.rejects(restoreCheckpoint(missingPart,key,stake,async ids=>settingsCheckpoint.chunks.filter(row=>ids.includes(row.id))),/integrity/);
if(process.env.TEST_LARGE_SETTINGS==='1'){
  const large:VaultData={version:1,snapshot:null,settings:{ethereum:'x'.repeat(101*1024*1024)}};
  const checkpoint=await prepareCheckpoint(large,key,stake,null);
  const result=await restoreCheckpoint(checkpoint.index,key,stake,async ids=>checkpoint.chunks.filter(row=>ids.includes(row.id)));
  assert.equal(result.settings.ethereum,large.settings.ethereum);
  assert.equal((await prepareCheckpoint(large,key,stake,checkpoint.index)).chunks.length,0);
  console.log('PASS: 101 MB settings history encrypted, restored and reused through generic chunks.');
}
if(process.env.TEST_LARGE_CHECKPOINT==='1'){
  const large=structuredClone(data);
  large.snapshot!.data.facts[a]={padding:'x'.repeat(51*1024*1024)} as any;
  large.snapshot!.data.facts[b]={padding:'y'.repeat(51*1024*1024)} as any;
  const checkpoint=await prepareCheckpoint(large,key,stake,null);
  const result=await restoreCheckpoint(checkpoint.index,key,stake,async ids=>{
    assert.ok(ids.length<=4);
    return checkpoint.chunks.filter(row=>ids.includes(row.id));
  });
  assert.equal((result.snapshot!.data.facts[a] as any).padding.length,51*1024*1024);
  assert.equal((result.snapshot!.data.facts[b] as any).padding.length,51*1024*1024);
  console.log('PASS: encrypted 102 MB checkpoint restores without dropping data.');
}
console.log('PASS: incremental buckets, settings-only checkpoints, roundtrip, integrity and cancellation.');
