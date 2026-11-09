import test from 'node:test';
import assert from 'node:assert/strict';
import {memberWallets} from './member.ts';
import {sealVault,openVault} from './vault-crypto.ts';
import {addWalletKeyLink,openWalletLinkedVault,envelopeWithWalletLinks} from './vault-links.ts';
const account='portfolio:12345678-1234-4123-8123-123456789abc';
const other='portfolio:87654321-1234-4123-8123-123456789abc';
const stake='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
test('account identities never become tracked wallets and saved Cardano addresses remain editable',()=>{
 assert.deepEqual(memberWallets(account,[]),[]);
 assert.deepEqual(memberWallets(account,[{address:stake,label:'My ADA'},{address:account,label:'not a wallet'}]),[{address:stake,label:'My ADA'}]);
 assert.equal(memberWallets(account,[]).length,0,'removing the final account wallet does not recreate a primary stake');
 assert.equal(memberWallets(stake,[])[0].address,stake,'wallet-login portfolios still include the verified primary stake');
 assert.throws(()=>memberWallets('x:alice',[]));
});
test('passkey wrapping keys protect account caches, retain original access when linked and reject another account',async()=>{
 const first=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const second=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const data={version:1,settings:{['tdsp-member-wallets-v1:'+account]:JSON.stringify([{address:stake,label:'Private ADA'}])},snapshot:null};
 const initial=await sealVault(first,account,data);
 await assert.rejects(openVault(first,other,initial));await assert.rejects(openVault(second,account,initial));
 const linked=await addWalletKeyLink(first,first,second,account);
 const payload=envelopeWithWalletLinks(await sealVault(linked.key,account,data),linked.links);
 assert.deepEqual((await openWalletLinkedVault(first,account,payload)).data,data);
 assert.deepEqual((await openWalletLinkedVault(second,account,payload)).data,data);
 await assert.rejects(openWalletLinkedVault(second,other,payload));
 assert.ok(!JSON.stringify(payload).includes(stake));assert.equal(linked.key.extractable,false);
});
