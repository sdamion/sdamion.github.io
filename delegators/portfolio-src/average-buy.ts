import {tradeOf} from './core.ts';
import type {Fact,Acquisitions} from './core.ts';
import {historicalPurchaseCost} from './transaction-amounts.ts';

export function averageBuy(cost:number|null,quantity:number|null){
  return cost!==null&&Number.isFinite(cost)&&quantity!==null&&Number.isFinite(quantity)&&quantity>0?cost/quantity:null;
}

// Purchase averages describe acquisitions, not the FIFO lots still held after sends.
export function purchaseAverages(facts:Fact[],history:Record<string,number>,acquisitions:Acquisitions){
  const result:Record<string,{raw:bigint;usd:number|null;count:number}>={};
  for(const fact of new Map(facts.map(f=>[f.hash,f])).values()){
    if(fact.internal)continue;
    const trade=tradeOf(fact);
    for(const [id,raw] of Object.entries(fact.assets)){
      if(BigInt(raw)<=0n)continue;
      const linked=acquisitions[fact.hash]?.[id];
      const ada=linked?.ada??(trade?.id===id&&trade.side==='buy'?trade.costAda:null);
      if(ada===null)continue;
      const usd=historicalPurchaseCost(ada,linked?.time??fact.time,history);
      const previous=result[id]??{raw:0n,usd:0,count:0};
      result[id]={raw:previous.raw+BigInt(raw),usd:previous.usd===null||usd===null?null:previous.usd+usd,count:previous.count+1};
    }
  }
  return result;
}
