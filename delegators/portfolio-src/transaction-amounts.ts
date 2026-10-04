import type {Fact,Io} from './core';

// The on-chain fee is distinct from the fee attributable to the tracked wallet.
export function transactionNetworkFee(fact:Fact|undefined):string|null{
  for(const fee of [fact?.source?.fee,fact?.feeRaw]){
    if(typeof fee==='string'&&/^\d+$/.test(fee))return fee;
  }
  return null;
}

export function portfolioPaidFee(fact:Fact,owned:Set<string>,swaps:Set<string>):string|null{
  if(fact.feeRaw!==null)return fact.feeRaw;
  const source=fact.source;
  if(!source?.inputs.length||!source.outputs.length)return null;
  const matches=(row:Io,set:Set<string>)=>set.has(row.payment_addr?.bech32||'')||set.has(row.stake_addr||'');
  if(!source.inputs.every(row=>matches(row,owned)||matches(row,swaps)))return null;
  if(!source.outputs.some(row=>matches(row,owned)))return null;
  // A saved shared Swap address alone does not establish ownership of other recipients.
  if(source.inputs.some(row=>matches(row,swaps))&&!source.outputs.every(row=>matches(row,owned)||matches(row,swaps)))return null;
  return transactionNetworkFee(fact);
}

export function portfolioFeeTotal(facts:Fact[],owned:Set<string>,swaps:Set<string>):number{
  let raw=0n;
  for(const fact of new Map(facts.map(fact=>[fact.hash,fact])).values()){
    raw+=BigInt(portfolioPaidFee(fact,owned,swaps)||'0');
  }
  return lovelaceToAda(raw)!;
}

// Keep aggregation in lovelace; convert only for prices and display.
export function lovelaceToAda(raw:string|bigint|null|undefined):number|null{
  return raw==null?null:Number(BigInt(raw))/1e6;
}

export function adaUsdValue(ada:number|null,price:number|null|undefined):number|null{
  if(ada===null)return null;
  if(ada===0)return 0;
  return price!=null&&Number.isFinite(price)&&price>0?ada*price:null;
}

export function historicalAdaPrice(time:number,history:Record<string,number>):number|null{
  const price=history[new Date(time*1000).toISOString().slice(0,10)];
  return Number.isFinite(price)&&price>0?price:null;
}

export function transactionAmounts(raw:string|bigint|null|undefined,time:number,history:Record<string,number>,feeRaw?:string|null){
  const ada=lovelaceToAda(raw),price=historicalAdaPrice(time,history),feeAda=lovelaceToAda(feeRaw);
  return {ada,price,usd:adaUsdValue(ada,price),feeAda,feeUsd:adaUsdValue(feeAda,price)};
}
