import {openVault,sealVault,type VaultEnvelope} from './vault-crypto.ts';

export const MAX_WALLET_LINKS=16;
export type WalletKeySlot={id:string;iv:string;ciphertext:string};
export type LinkedVaultEnvelope={version:2;iv:string;ciphertext:string;wallet_keys:WalletKeySlot[]};
export type WalletLinks={slots:WalletKeySlot[];currentSlot:WalletKeySlot;wrappingKey:CryptoKey};
const text=new TextEncoder();
const base64=(value:Uint8Array)=>btoa(String.fromCharCode(...value));
const bytes=(value:string)=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
const aad=(stake:string,id:string)=>text.encode(`TDSP Portfolio wallet key v1\nStake address: ${stake}\nSlot: ${id}`);
const copySlot=({id,iv,ciphertext}:WalletKeySlot):WalletKeySlot=>({id,iv,ciphertext});
export function validWalletSlots(value:unknown):value is WalletKeySlot[]{
  return Array.isArray(value)&&value.length>0&&value.length<=MAX_WALLET_LINKS&&new Set(value.map(row=>row?.id)).size===value.length&&value.every(row=>row&&typeof row.id==='string'&&/^[a-f0-9]{32}$/.test(row.id)&&typeof row.iv==='string'&&/^[A-Za-z0-9+/]{16}$/.test(row.iv)&&typeof row.ciphertext==='string'&&/^[A-Za-z0-9+/]{64}$/.test(row.ciphertext));
}
async function wrap(raw:Uint8Array,key:CryptoKey,stake:string):Promise<WalletKeySlot>{
  const id=crypto.randomUUID().replaceAll('-',''),iv=crypto.getRandomValues(new Uint8Array(12));
  return {id,iv:base64(iv),ciphertext:base64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(stake,id)},key,raw)))};
}
async function unwrap(slot:WalletKeySlot,key:CryptoKey,stake:string){
  const raw=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(slot.iv),additionalData:aad(stake,slot.id)},key,bytes(slot.ciphertext)));
  if(raw.length!==32){raw.fill(0);throw new Error('Invalid linked Portfolio key.');}return raw;
}
const importDataKey=(raw:Uint8Array)=>crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
export function envelopeWithWalletLinks(payload:VaultEnvelope,links?:WalletLinks):VaultEnvelope|LinkedVaultEnvelope{
  if(!links)return payload;
  if(!validWalletSlots(links.slots))throw new Error('Invalid linked Portfolio key.');
  return {...payload,version:2,wallet_keys:links.slots.map(copySlot)};
}
export async function openWalletLinkedVault(wrappingKey:CryptoKey,stake:string,payload:VaultEnvelope|LinkedVaultEnvelope){
  if(payload?.version===1)return {key:wrappingKey,data:await openVault(wrappingKey,stake,payload),links:undefined};
  if(payload?.version!==2||!validWalletSlots(payload.wallet_keys))throw new Error('Invalid linked Portfolio key.');
  for(const slot of payload.wallet_keys){
    let raw:Uint8Array|undefined;
    try{
      raw=await unwrap(slot,wrappingKey,stake);const key=await importDataKey(raw);
      const data=await openVault(key,stake,{version:1,iv:payload.iv,ciphertext:payload.ciphertext});
      return {key,data,links:{slots:payload.wallet_keys.map(copySlot),currentSlot:copySlot(slot),wrappingKey}};
    }catch{/* A different wallet app has a different wrapping key. Try its slot. */}
    finally{raw?.fill(0);}
  }
  throw new Error('This wallet app could not unlock the saved Portfolio. Use a linked wallet app and the same stake account. The cache has not been changed.');
}
export async function addWalletKeyLink(key:CryptoKey,currentWrappingKey:CryptoKey,newWrappingKey:CryptoKey,stake:string,links?:WalletLinks){
  if(links&&(!validWalletSlots(links.slots)||!links.slots.some(slot=>slot.id===links.currentSlot.id&&slot.iv===links.currentSlot.iv&&slot.ciphertext===links.currentSlot.ciphertext)))throw new Error('Invalid linked Portfolio key.');
  if(!links){
    // Compatible apps may already reproduce the original signature-derived key.
    const probe=await sealVault(key,stake,{walletLinkProbe:true});
    try{await openVault(newWrappingKey,stake,probe);return {key,links:undefined,changed:false};}catch{/* Create a random data key and retain the original wallet's access. */}
  }
  let raw:Uint8Array|undefined;
  try{
    let nextLinks:WalletLinks;
    if(links){raw=await unwrap(links.currentSlot,links.wrappingKey,stake);nextLinks={...links,slots:links.slots.map(copySlot)};}
    else{
      raw=crypto.getRandomValues(new Uint8Array(32));key=await importDataKey(raw);
      const currentSlot=await wrap(raw,currentWrappingKey,stake);nextLinks={slots:[currentSlot],currentSlot,wrappingKey:currentWrappingKey};
    }
    for(const slot of nextLinks.slots){
      let candidate:Uint8Array|undefined;
      try{candidate=await unwrap(slot,newWrappingKey,stake);if(candidate.every((byte,index)=>byte===raw![index]))return {key,links:nextLinks,changed:false};}catch{/* The selected app has not been linked to this slot. */}finally{candidate?.fill(0);}
    }
    if(nextLinks.slots.length>=MAX_WALLET_LINKS)throw new Error('This Portfolio already has the maximum of 16 linked wallet approvals.');
    nextLinks.slots.push(await wrap(raw,newWrappingKey,stake));
    return {key,links:nextLinks,changed:true};
  }finally{raw?.fill(0);}
}
