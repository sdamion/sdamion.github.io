import type {Fact,Acquisitions} from './core.ts';

export type PaymentLink={assetId:string;receiptHash:string;paymentHash:string;lovelace:string};
export function paymentBudget(f:Fact):bigint|null {
  if(f.internal||!f.swapCandidate||f.feeRaw===null||!f.externalOutputs?.length)return null;
  const spent=-(BigInt(f.adaRaw)+BigInt(f.feeRaw));
  const outputs=f.externalOutputs.reduce((n,o)=>n+BigInt(o.lovelace),0n);
  // Only attribute a payment when owned inputs fund exactly the external outputs.
  // Deposits, withdrawals, shared inputs and own change must not become a mint price.
  return spent>0n&&spent===outputs?spent:null;
}
export function adaToLovelace(value:string):string|null {
  if(!/^\d+(?:\.\d{1,6})?$/.test(value.trim()))return null;
  const [whole,fraction='']=value.trim().split('.');
  return String(BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0')));
}
export function mintPayments(facts:Fact[],links:PaymentLink[]) {
  const byHash=new Map(facts.map(f=>[f.hash,f]));
  const acquisitions:Acquisitions={};const errors:string[]=[];
  const used=new Map<string,bigint>();const seen=new Set<string>();
  const blockedReceipts=new Set(links.map(l=>l.receiptHash));
  const blockedPayments=new Set(links.map(l=>l.paymentHash));
  for(const link of links){
    const receipt=byHash.get(link.receiptHash),payment=byHash.get(link.paymentHash);
    const key=link.receiptHash+':'+link.assetId;
    const budget=payment?paymentBudget(payment):null;
    const raw=receipt?.assets[link.assetId];
    const amount=/^\d+$/.test(link.lovelace)?BigInt(link.lovelace):0n;
    const allocated=(used.get(link.paymentHash)||0n)+amount;
    if(!receipt||receipt.internal||!raw||BigInt(raw)<=0n||!payment||budget===null||amount<=0n||allocated>budget||seen.has(key)||
       (payment.hash!==receipt.hash&&Object.keys(payment.assets).length>0)){
      errors.push('Payment link is unavailable, duplicated, or exceeds the unallocated ADA payment.');continue;
    }
    seen.add(key);used.set(payment.hash,allocated);
    (acquisitions[receipt.hash]??={})[link.assetId]={raw,ada:Number(amount)/1e6,time:payment.time,paymentHash:payment.hash,source:'confirmed'};
  }
  for(const f of byHash.values()){
    if(blockedReceipts.has(f.hash)||blockedPayments.has(f.hash))continue;
    const entries=Object.entries(f.assets);
    if(entries.length!==1)continue;
    const [id,raw]=entries[0];
    // Exclude pre-existing units received alongside a mint of the same asset.
    if(BigInt(raw)<=0n||f.minted?.[id]!==raw)continue;
    const budget=paymentBudget(f);if(budget===null)continue;
    acquisitions[f.hash]={[id]:{raw,ada:Number(budget)/1e6,time:f.time,paymentHash:f.hash,source:'mint'}};
  }
  // Follow the exact payment output consumed by the mint transaction. Never
  // match by date, similar amounts or a shared service address alone.
  const candidates=new Map<string,{receipt:Fact;payment:Fact;id:string;raw:string;paid:bigint}[]>();
  for(const receipt of byHash.values()){
    if(blockedReceipts.has(receipt.hash)||acquisitions[receipt.hash]||receipt.internal||!receipt.swapCandidate||receipt.ownedInputCount!==0)continue;
    const assets=Object.entries(receipt.assets),minted=Object.entries(receipt.minted||{});
    if(assets.length!==1||minted.length!==1)continue;
    const [id,raw]=assets[0];
    if(BigInt(raw)<=0n||receipt.minted?.[id]!==raw)continue;
    const refs=new Set(receipt.inputRefs||[]);
    const matches=[...new Set([...refs].map(ref=>ref.split(':')[0]))].flatMap(hash=>{
      const payment=byHash.get(hash);
      if(!payment||blockedPayments.has(hash)||Object.keys(payment.assets).length||payment.time>receipt.time)return [];
      const budget=paymentBudget(payment);
      if(budget===null||!payment.externalOutputs?.every(o=>o.txHash===hash&&Number.isInteger(o.txIndex)&&refs.has(hash+':'+o.txIndex)))return [];
      const returned=BigInt(receipt.adaRaw);
      if(returned<0n||returned>=budget)return [];
      return [{receipt,payment,id,raw,paid:budget-returned}];
    });
    if(matches.length!==1)continue;
    const match=matches[0];
    candidates.set(match.payment.hash,[...(candidates.get(match.payment.hash)||[]),match]);
  }
  for(const matches of candidates.values()){
    if(matches.length!==1)continue;
    const {receipt,payment,id,raw,paid}=matches[0];
    acquisitions[receipt.hash]={[id]:{raw,ada:Number(paid)/1e6,time:payment.time,paymentHash:payment.hash,source:'linked-mint'}};
  }
  return {acquisitions,errors};
}
