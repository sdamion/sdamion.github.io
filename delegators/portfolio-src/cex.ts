import {validWalletAddress} from './member.ts';
import type {Fact,Counterparty} from './core.ts';
export type CexAddress={address:string;name:string};
export function normalizeCexAddresses(value:unknown):CexAddress[]{
  if(!Array.isArray(value))return [];
  const entries=new Map<string,CexAddress>();
  for(const item of value){
    if(typeof item?.address!=='string'||typeof item?.name!=='string')continue;
    const address=item.address.trim().toLowerCase(),name=item.name.trim().slice(0,60);
    if(validWalletAddress(address)&&name)entries.set(address,{address,name});
  }
  return [...entries.values()];
}
export function cexDestinations(fact:Fact,entries:CexAddress[]){
  if(fact.internal)return [];
  return matchCounterparties(fact.externalOutputs||[],entries);
}
function matchCounterparties(rows:Counterparty[],entries:CexAddress[]){
  return rows.flatMap(output=>{
    const match=entries.find(entry=>entry.address===output.address)||entries.find(entry=>entry.address===output.stakeAddress);
    return match?[{...output,name:match.name}]:[];
  });
}
export function cexSources(fact:Fact,entries:CexAddress[]){
  return fact.internal?[]:matchCounterparties(fact.externalInputs||[],entries);
}
export function cexAdjustedFact(fact:Fact,entries:CexAddress[]):Fact{
  return cexDestinations(fact,entries).length||cexSources(fact,entries).length?{...fact,swapCandidate:false}:fact;
}
