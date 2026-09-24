import {validByronAddress} from './exchange-address.ts';
import type {Fact} from './core.ts';
import type {CexAddress} from './cex.ts';
import {cexAdaTransfer} from './cex.ts';

export function byronAddressTransactions(facts:Fact[],address:string,entries:CexAddress[]=[]){
  return [...new Map(facts.map(fact=>[fact.hash,fact])).values()]
    .filter(fact=>[...fact.externalInputs||[],...fact.externalOutputs||[]].some(row=>row.address===address))
    .map(fact=>{
      const individual=cexAdaTransfer(fact,[{address,name:'Byron'}]);
      // Incoming value belongs to the transaction, not to one of its funding inputs.
      const grouped=entries.some(entry=>entry.address===address)?cexAdaTransfer(fact,entries):null;
      const transfer=individual||(grouped?.side==='buy'?grouped:null);
      const sharedInputs=transfer?.side==='buy'&&new Set((fact.externalInputs||[]).map(row=>row.address)).size>1;
      return {hash:fact.hash,time:fact.time,walletChangeRaw:fact.adaRaw,side:transfer?.side??null,amountRaw:transfer?String(transfer.raw):null,sharedInputs};
    }).sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash));
}

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
  return [...found.values()].map(item=>({address:item.address,transactions:item.hashes.size,lastSeen:item.lastSeen})).sort((a,b)=>(b.lastSeen??-Infinity)-(a.lastSeen??-Infinity)||a.address.localeCompare(b.address));
}

export function saveByronSelection(entries:CexAddress[],candidates:string[],selected:Set<string>,name:string,owned:string[],names:Record<string,string>={}){
  const allowed=new Set(candidates.filter(address=>!owned.includes(address)&&validByronAddress(address)));
  const next=entries.filter(entry=>!allowed.has(entry.address)||selected.has(entry.address)).map(entry=>allowed.has(entry.address)&&names[entry.address]?.trim()?{...entry,name:names[entry.address].trim().slice(0,60)}:entry);
  const saved=new Set(next.map(entry=>entry.address));
  for(const address of selected)if(allowed.has(address)&&!saved.has(address)){
    next.push({address,name:(names[address]?.trim()||name.trim()).slice(0,60)||'Byron CEX'});saved.add(address);
  }
  return next;
}
