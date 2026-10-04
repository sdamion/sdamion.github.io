import assert from 'node:assert/strict';
import {bech32} from '@scure/base';
import {knownDexAddresses,knownDexIdentity} from './known-dex-addresses.ts';
assert.equal(new Set(knownDexAddresses.map(entry=>knownDexIdentity(entry).value)).size,knownDexAddresses.length);
for(const name of ['SundaeSwap','DexHunter','MuesliSwap','CSwap']){
  assert.ok(knownDexAddresses.some(entry=>entry.name.startsWith(name)),`${name} is included`);
}
for(const entry of knownDexAddresses){
  const identity=knownDexIdentity(entry);
  if(entry.address){
    const decoded=bech32.decode(entry.address,200);
    const bytes=bech32.fromWords(decoded.words);
    assert.equal(decoded.prefix,'addr');
    assert.equal(bytes[0]&15,1,'mainnet only');
    assert.ok([1,3,5,7].includes(bytes[0]>>4),'script payment credential');
    assert.equal(identity.label,'address');
    assert.equal(identity.url,`https://cardanoscan.io/address/${entry.address}`);
  }else{
    assert.match(entry.scriptHash,/^[a-f0-9]{56}$/);
    assert.equal(identity.label,'script hash');
    assert.equal(identity.url,`https://cardanoscan.io/script/${entry.scriptHash}`);
  }
  assert.ok(entry.name&&entry.role);
  const source=new URL(entry.source);
  assert.equal(source.protocol,'https:');
  assert.ok(['github.com','api.sundae.fi'].includes(source.hostname));
}
console.log('PASS: unique DEX identities, valid mainnet addresses and script hashes, explorer links and source attribution.');
