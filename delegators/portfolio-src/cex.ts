import {validAddress} from './core.ts';
import type {Fact} from './core.ts';
export type CexAddress={address:string;name:string};
export function normalizeCexAddresses(value:unknown):CexAddress[]{
  if(!Array.isArray(value))return [];
  const entries=new Map<string,CexAddress>();
  for(const item of value){
    if(typeof item?.address!=='string'||typeof item?.name!=='string')continue;
    const address=item.address.trim().toLowerCase(),name=item.name.trim().slice(0,60);
    if(validAddress(address)&&name)entries.set(address,{address,name});
  }
  return [...entries.values()];
}
export function cexDestinations(fact:Fact,entries:CexAddress[]){
  if(fact.internal)return [];
  return (fact.externalOutputs||[]).flatMap(output=>{
    const match=entries.find(entry=>entry.address===output.address);
    return match?[{...output,name:match.name}]:[];
  });
}
export function cexAdjustedFact(fact:Fact,entries:CexAddress[]):Fact{
  return cexDestinations(fact,entries).length?{...fact,swapCandidate:false}:fact;
}
