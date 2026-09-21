import {validWalletAddress} from './member.ts';
import {adaReceiptBasis} from './core.ts';
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
  return isCexTransaction(fact,entries)?{...fact,swapCandidate:false}:fact;
}
export function isCexTransaction(fact:Fact|undefined,entries:CexAddress[]):boolean{
  return !!fact&&(cexDestinations(fact,entries).length>0||cexSources(fact,entries).length>0);
}

export function cexAdaTransfer(fact:Fact,entries:CexAddress[]){
  const sources=cexSources(fact,entries),destinations=cexDestinations(fact,entries);
  const net=BigInt(fact.adaRaw)+BigInt(fact.feeRaw||'0');
  if(net>0n&&sources.length>0&&sources.length===fact.externalInputs?.length&&destinations.length===0)
    return {side:'buy' as const,raw:net};
  const sold=destinations.reduce((sum,row)=>sum+BigInt(row.lovelace),0n);
  if(sold>0n&&fact.feeRaw!==null&&sold<=-net)
    return {side:'sell' as const,raw:sold};
  return null;
}

export function cexAdaPerformance(facts:Fact[],entries:CexAddress[],history:Record<string,number>,complete:boolean){
  let bought=0n,sold=0n,realised=0,unpricedSales=0,pricedSales=0;
  const unique=[...new Map(facts.map(fact=>[fact.hash,fact])).values()];
  // Partial history can start with an outgoing transaction. For live estimates,
  // use only priced receipts preceding each sale, without inventing an opening balance.
  const receiptAverages=new Map<string,number>();
  if(!complete){
    let receipts=0,receiptCost=0;
    for(const fact of [...unique].sort((a,b)=>a.time-b.time||a.hash.localeCompare(b.hash))){
      const received=fact.internal?0:Math.max(0,Number(BigInt(fact.adaRaw)+BigInt(fact.feeRaw||'0'))/1e6);
      const price=history[new Date(fact.time*1000).toISOString().slice(0,10)];
      if(received>0&&Number.isFinite(price)&&price>0){receipts+=received;receiptCost+=received*price;}
      if(receipts>0)receiptAverages.set(fact.hash,receiptCost/receipts);
    }
  }
  const transfers=new Map(unique.map(fact=>[fact.hash,cexAdaTransfer(fact,entries)]));
  for(const transfer of transfers.values()){
    if(transfer?.side==='buy')bought+=transfer.raw;
    if(transfer?.side==='sell')sold+=transfer.raw;
  }
  adaReceiptBasis(unique,history,(fact,average)=>{
    const transfer=transfers.get(fact.hash);
    if(transfer?.side!=='sell')return;
    const price=history[new Date(fact.time*1000).toISOString().slice(0,10)];
    const cost=average??(!complete?receiptAverages.get(fact.hash)??null:null);
    if(cost===null||!Number.isFinite(price)||price<=0){unpricedSales++;return;}
    pricedSales++;
    realised+=Number(transfer.raw)/1e6*(price-cost);
  });
  const metadataComplete=unique.every(fact=>Array.isArray(fact.externalInputs));
  const final=complete&&metadataComplete&&unpricedSales===0;
  return {boughtRaw:String(bought),soldRaw:String(sold),realisedUsd:final||(!complete&&pricedSales>0)?realised:null,provisional:!complete,pricedSales,unpricedSales,metadataComplete};
}
