import {tradeOf,units} from './core.ts';
import type {Fact,Market} from './core.ts';

export function transactionPrices(facts:Fact[],markets:Record<string,Market>,history:Record<string,number>){
  const prices:Record<string,{usd:number;ada:number;time:number;hash:string;decimals:number}>={};
  for(const fact of [...facts].sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash))){
    const trade=tradeOf(fact);
    if(!trade||prices[trade.id]||!Number.isFinite(fact.time)||fact.time<=0)continue;
    const decimals=markets[trade.id]?.decimals??fact.decimals?.[trade.id];
    if(decimals==null||!Number.isInteger(decimals)||decimals<0||decimals>30)continue;
    const quantity=units(trade.raw,decimals);
    const daily=history[new Date(fact.time*1000).toISOString().slice(0,10)];
    if(!quantity||!Number.isFinite(quantity)||!Number.isFinite(daily)||daily<=0)continue;
    const ada=trade.ada/quantity,usd=ada*daily;
    if(Number.isFinite(usd)&&usd>0)prices[trade.id]={usd,ada,time:fact.time,hash:fact.hash,decimals};
  }
  return prices;
}
