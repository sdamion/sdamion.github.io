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

export function groupByronAddresses(facts:Fact[],candidates:ReturnType<typeof discoveredByronAddresses>){
  const parent=new Map(candidates.map(row=>[row.address,row.address]));
  const root=(address:string)=>{let current=address;while(parent.get(current)!==current)current=parent.get(current)!;let next=address;while(next!==current){const previous=parent.get(next)!;parent.set(next,current);next=previous;}return current;};
  const transactions=[...new Map(facts.map(fact=>[fact.hash,fact])).values()].map(fact=>({fact,addresses:[...new Set([...fact.externalInputs||[],...fact.externalOutputs||[]].map(row=>row.address).filter(address=>parent.has(address)))]}));
  for(const {addresses} of transactions)for(const address of addresses.slice(1)){const first=root(addresses[0]),other=root(address);if(first!==other)parent.set(other,first);}
  const groups=new Map<string,{addresses:string[];hashes:Set<string>;lastSeen:number|null}>();
  for(const row of candidates){const id=root(row.address);if(!groups.has(id))groups.set(id,{addresses:[],hashes:new Set(),lastSeen:null});groups.get(id)!.addresses.push(row.address);}
  for(const {fact,addresses} of transactions){if(!addresses.length)continue;const group=groups.get(root(addresses[0]))!;group.hashes.add(fact.hash);group.lastSeen=Math.max(group.lastSeen??0,fact.time);}
  return [...groups.values()].map(group=>({addresses:group.addresses.sort(),transactions:group.hashes.size,lastSeen:group.lastSeen})).sort((a,b)=>(b.lastSeen??-Infinity)-(a.lastSeen??-Infinity)||a.addresses[0].localeCompare(b.addresses[0]));
}

export function byronGroupTransactions(facts:Fact[],addresses:string[],entries:CexAddress[]){
  if(addresses.length===1)return byronAddressTransactions(facts,addresses[0],entries);
  const members=new Set(addresses),selected=entries.filter(entry=>members.has(entry.address));
  return [...new Map(facts.map(fact=>[fact.hash,fact])).values()]
    .filter(fact=>[...fact.externalInputs||[],...fact.externalOutputs||[]].some(row=>members.has(row.address)))
    .map(fact=>{const transfer=cexAdaTransfer(fact,selected);return {hash:fact.hash,time:fact.time,walletChangeRaw:fact.adaRaw,side:transfer?.side??null,amountRaw:transfer?String(transfer.raw):null,sharedInputs:transfer?.side==='buy'&&new Set((fact.externalInputs||[]).map(row=>row.address)).size>1};})
    .sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash));
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
