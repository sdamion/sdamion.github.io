import {tradeOf,units} from './core.ts';
import type {Fact,Market,Acquisitions,Acquisition} from './core.ts';

export function transactionPrices(facts:Fact[],markets:Record<string,Market>,history:Record<string,number>,acquisitions:Acquisitions={}){
  const prices:Record<string,{usd:number;ada:number;time:number;hash:string;decimals:number;source?:Acquisition['source']}>={};
  for(const fact of [...facts].sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash))){
    const trade=tradeOf(fact);
    const linked=acquisitions[fact.hash]||{};
    const candidates:{id:string;raw:string;ada:number;time:number;hash:string;source?:Acquisition['source']}[]=Object.entries(linked).map(([id,a])=>({id,...a,hash:a.paymentHash}));
    if(trade&&!linked[trade.id])candidates.push({...trade,time:fact.time,hash:fact.hash});
    for(const candidate of candidates){
    if(prices[candidate.id]||!Number.isFinite(candidate.time)||candidate.time<=0)continue;
    const decimals=markets[candidate.id]?.decimals??fact.decimals?.[candidate.id];
    if(decimals==null||!Number.isInteger(decimals)||decimals<0||decimals>30)continue;
    const quantity=units(candidate.raw,decimals);
    const daily=history[new Date(candidate.time*1000).toISOString().slice(0,10)];
    if(!quantity||!Number.isFinite(quantity)||!Number.isFinite(daily)||daily<=0)continue;
    const ada=candidate.ada/quantity,usd=ada*daily;
    if(Number.isFinite(usd)&&usd>0)prices[candidate.id]={usd,ada,time:candidate.time,hash:candidate.hash,decimals,source:candidate.source};
    }
  }
  return prices;
}
