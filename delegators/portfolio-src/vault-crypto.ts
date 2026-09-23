import {decode,encode,Tagged} from 'cborg';
import {bech32} from '@scure/base';
import {blake2b} from '@noble/hashes/blake2.js';
import {validStakeAddress} from './member.ts';

const text=new TextEncoder();
const hex=(s:string)=>{
  if(!/^(?:[a-fA-F0-9]{2})+$/.test(s)||s.length>32768)throw new Error('Invalid wallet signing response.');
  return Uint8Array.from(s.match(/../g)!,b=>parseInt(b,16));
};
const same=(a:Uint8Array,b:Uint8Array)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export function unlockMessage(stake:string){
  if(!validStakeAddress(stake))throw new Error('A verified stake address is required.');
  return `TDSP Portfolio private cache unlock v1\nApplication: www.thedutchstakepool.com\nNetwork: Cardano Mainnet\nStake address: ${stake}\nPurpose: derive a private encryption key in this browser only.\nNever publish or share this signature. This is not a login or transaction.`;
}
export async function deriveVaultKey(stake:string,signed:{signature:string;key:string}){
  let cose=decode(hex(signed.signature),{useMaps:true,tags:{18:(value:unknown)=>value}}) as any;
  if(cose instanceof Tagged)cose=cose.value;
  const key=decode(hex(signed.key),{useMaps:true}) as Map<number,any>;
  if(!Array.isArray(cose)||cose.length!==4||!(cose[0] instanceof Uint8Array)||!(cose[1] instanceof Map)||!(cose[2] instanceof Uint8Array)||!(cose[3] instanceof Uint8Array)||cose[3].length!==64||!(key instanceof Map)||key.get(1)!==1||key.get(3)!==-8||key.get(-1)!==6||!(key.get(-2) instanceof Uint8Array)||key.get(-2).length!==32)throw new Error('Unsupported wallet signature format.');
  const headers=decode(cose[0],{useMaps:true}) as Map<any,any>;
  const address=bech32.fromWords(bech32.decode(stake as `${string}1${string}`,200).words);
  if(address[0]!==0xe1||!same(address.slice(1),blake2b(key.get(-2),{dkLen:28})))throw new Error('Unlock signature is not from the authenticated stake key.');
  if(!(headers instanceof Map)||headers.get(1)!==-8||!(headers.get('address') instanceof Uint8Array)||!same(headers.get('address'),address)||cose[1].get('hashed')===true||!same(cose[2],text.encode(unlockMessage(stake))))throw new Error('Wallet signed a different unlock message or account.');
  const publicKey=await crypto.subtle.importKey('raw',key.get(-2),{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',publicKey,cose[3],encode(['Signature1',cose[0],new Uint8Array(),cose[2]])))throw new Error('Wallet unlock signature could not be verified.');
  const material=await crypto.subtle.importKey('raw',cose[3],'HKDF',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:text.encode('TDSP Portfolio vault v1'),info:text.encode(stake)},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
const base64=(bytes:Uint8Array)=>{let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);};
const unbase64=(value:string)=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export type VaultEnvelope={version:1;iv:string;ciphertext:string};
export async function sealVault(key:CryptoKey,stake:string,data:unknown):Promise<VaultEnvelope>{
  const bytes=text.encode(JSON.stringify(data));
  if(bytes.length>100*1024*1024)throw new Error('Portfolio cache exceeds the 100 MB limit.');
  const compressed=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:text.encode(unlockMessage(stake))},key,compressed);
  if(ciphertext.byteLength>23*1024*1024)throw new Error('Encrypted Portfolio cache exceeds the upload limit.');
  return {version:1,iv:base64(iv),ciphertext:base64(new Uint8Array(ciphertext))};
}
export async function openVault(key:CryptoKey,stake:string,envelope:VaultEnvelope){
  if(envelope?.version!==1||typeof envelope.iv!=='string'||typeof envelope.ciphertext!=='string'||envelope.ciphertext.length>32*1024*1024)throw new Error('Invalid encrypted Portfolio cache.');
  const iv=unbase64(envelope.iv);if(iv.length!==12)throw new Error('Invalid Portfolio nonce.');
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:text.encode(unlockMessage(stake))},key,unbase64(envelope.ciphertext));
  const reader=new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const parts:Uint8Array[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100*1024*1024)throw new Error('Portfolio cache is too large.');parts.push(value);}}finally{await reader.cancel();}
  return JSON.parse(await new Blob(parts).text());
}
