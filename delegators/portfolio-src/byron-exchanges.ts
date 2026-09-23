import {validByronAddress} from './exchange-address.ts';
import type {Fact} from './core.ts';
import type {CexAddress} from './cex.ts';

export function discoveredByronAddresses(facts:Fact[],owned:string[],entries:CexAddress[]){
  const excluded=new Set(owned),valid=new Map<string,boolean>();
  const found=new Map<string,{address:string;hashes:Set<string>;lastSeen:number|null}>();
  function get(address:string){
    if(excluded.has(address))return;
    if(!valid.has(address))valid.set(address,validByronAddress(address));
    if(!valid.get(address))return;
    if(!found.has(address))found.set(address,{address,hashes:new Set(),lastSeen:null});
    return found.get(address)!;
  }
  for(const fact of facts)for(const row of [...fact.externalInputs||[],...fact.externalOutputs||[]]){
    const item=get(row.address);if(!item)continue;
    item.hashes.add(fact.hash);
    item.lastSeen=Math.max(item.lastSeen??0,fact.time);
  }
  for(const entry of entries)get(entry.address);
  return [...found.values()].map(item=>({address:item.address,transactions:item.hashes.size,lastSeen:item.lastSeen})).sort((a,b)=>b.transactions-a.transactions||a.address.localeCompare(b.address));
}

export function saveByronSelection(entries:CexAddress[],candidates:string[],selected:Set<string>,name:string,owned:string[]){
  const allowed=new Set(candidates.filter(address=>!owned.includes(address)&&validByronAddress(address)));
  const next=entries.filter(entry=>!allowed.has(entry.address)||selected.has(entry.address));
  const saved=new Set(next.map(entry=>entry.address));
  for(const address of selected)if(allowed.has(address)&&!saved.has(address)){
    next.push({address,name:name.trim().slice(0,60)||'Byron CEX'});saved.add(address);
  }
  return next;
}
