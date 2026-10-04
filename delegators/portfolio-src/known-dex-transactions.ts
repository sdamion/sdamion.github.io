import {bech32} from '@scure/base';
import type {Fact} from './core.ts';
import {knownDexAddresses} from './known-dex-addresses.ts';

function paymentScript(address:string):string|null {
  try{
    const decoded=bech32.decode(address,200);
    const bytes=bech32.fromWords(decoded.words);
    const type=bytes[0]>>4;
    if(decoded.prefix!=='addr'||(bytes[0]&15)!==1||![1,3,5,7].includes(type))return null;
    if((type===1||type===3)&&bytes.length!==57||type===7&&bytes.length!==29||type===5&&bytes.length<32)return null;
    return [...bytes.slice(1,29)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  }catch{return null;}
}

const contracts=new Map<string,Set<string>>();
for(const entry of knownDexAddresses){
  const hash=entry.scriptHash??paymentScript(entry.address);
  if(!hash)continue;
  const names=contracts.get(hash)??new Set<string>();
  names.add(entry.name);contracts.set(hash,names);
}

// Recognition only: never add public scripts to owned wallets or CEX accounting rules.
export function knownTransactionDexNames(fact:Fact|undefined):string[]{
  if(!fact)return [];
  const addresses=new Set([
    ...(fact.externalInputs||[]).map(row=>row.address),
    ...(fact.externalOutputs||[]).map(row=>row.address),
    ...(fact.source?.inputs||[]).map(row=>row.payment_addr?.bech32||''),
    ...(fact.source?.outputs||[]).map(row=>row.payment_addr?.bech32||''),
  ]);
  const names=new Set<string>();
  for(const address of addresses){
    const hash=paymentScript(address);
    for(const name of hash?contracts.get(hash)||[]:[])names.add(name);
  }
  return [...names].sort();
}
