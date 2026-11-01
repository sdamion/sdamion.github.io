import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {encode} from 'cborg';
import {bech32} from '@scure/base';
import {blake2b} from '@noble/hashes/blake2.js';
import {deriveVaultKey,unlockMessage,sealVault,openVault} from './vault-crypto.ts';
import {addWalletKeyLink,openWalletLinkedVault,envelopeWithWalletLinks,validWalletSlots,MAX_WALLET_LINKS} from './vault-links.ts';
const pair=generateKeyPairSync('ed25519'),pub=new Uint8Array(pair.publicKey.export({type:'spki',format:'der'}).subarray(-32));
const address=Uint8Array.from([0xe1,...blake2b(pub,{dkLen:28})]),stake=bech32.encode('stake',bech32.toWords(address));
function approval(reverse=false,extra:string|boolean=false){
 const headers=encode(new Map(reverse?[['address',address],[1,-8],...(extra?[[3,extra===true?'text/plain':extra]]:[])] as any:[[1,-8],['address',address]]));
 const payload=new TextEncoder().encode(unlockMessage(stake)),signature=sign(null,encode(['Signature1',headers,new Uint8Array(),payload]),pair.privateKey);
 return {signature:Buffer.from(encode([headers,new Map([['hashed',false]]),payload,signature])).toString('hex'),key:Buffer.from(encode(new Map([[1,1],[3,-8],[-1,6],[-2,pub]] as any))).toString('hex')};
}
test('different app COSE encodings for the same stake account unlock a linked random data key, without exposing keys',async()=>{
 const first=await deriveVaultKey(stake,approval()),second=await deriveVaultKey(stake,approval(true,true));
 const data={privateLabel:'Savings',amount:'12345678901234567890'},legacy=await sealVault(first,stake,data);
 await assert.rejects(openVault(second,stake,legacy));
 const linked=await addWalletKeyLink(first,first,second,stake);assert.equal(linked.changed,true);assert.equal(linked.links!.slots.length,2);assert.equal(linked.key.extractable,false);
 const payload=envelopeWithWalletLinks(await sealVault(linked.key,stake,data),linked.links);
 for(const key of [first,second]){const opened=await openWalletLinkedVault(key,stake,payload);assert.deepEqual(opened.data,data);assert.equal(opened.key.extractable,false);}
 assert.equal(JSON.stringify(payload).includes(data.privateLabel),false);assert.equal(JSON.stringify(payload).includes(approval().signature),false);
 assert.equal(validWalletSlots(linked.links!.slots),true);assert.notEqual(linked.links!.slots[0].iv,linked.links!.slots[1].iv);
 const same=await addWalletKeyLink(first,first,first,stake);assert.equal(same.changed,false);assert.equal(same.links,undefined);
 const duplicate=await addWalletKeyLink(linked.key,first,second,stake,linked.links);assert.equal(duplicate.changed,false);assert.equal(duplicate.links!.slots.length,2);
});
test('a linked second app can add a third; wrong accounts, forged slots and cross-member wrappers fail closed',async()=>{
 const first=await deriveVaultKey(stake,approval()),second=await deriveVaultKey(stake,approval(true,true)),third=await deriveVaultKey(stake,approval(true,'application/tdsp'));
 const initial=await addWalletKeyLink(first,first,second,stake),data={version:1,secret:'test'};
 const root=envelopeWithWalletLinks(await sealVault(initial.key,stake,data),initial.links);
 const opened=await openWalletLinkedVault(second,stake,root),extended=await addWalletKeyLink(opened.key,second,third,stake,opened.links);
 const next=envelopeWithWalletLinks(await sealVault(extended.key,stake,data),extended.links);
 assert.deepEqual((await openWalletLinkedVault(third,stake,next)).data,data);
 const stranger=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 await assert.rejects(openWalletLinkedVault(stranger,stake,next));await assert.rejects(openWalletLinkedVault(first,stake+'x',next));
 if(next.version!==2)throw Error('not linked');
 await assert.rejects(openWalletLinkedVault(first,stake,{...next,wallet_keys:next.wallet_keys.map(slot=>({...slot,id:'0'.repeat(32)}))}));
 await assert.rejects(openWalletLinkedVault(first,stake,{...next,ciphertext:next.ciphertext.replace(/^./,next.ciphertext[0]==='A'?'B':'A')}));
 assert.equal(validWalletSlots(Array.from({length:MAX_WALLET_LINKS+1},(_,id)=>({...next.wallet_keys[0],id:id.toString(16).padStart(32,'0')}))),false);
 const unknownStake='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
 await assert.rejects(deriveVaultKey(unknownStake,approval(true)));
});
