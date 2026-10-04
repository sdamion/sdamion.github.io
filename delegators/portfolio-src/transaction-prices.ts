import {tradeOf,units} from './core.ts';
import type {Fact,Market,Acquisitions} from './core.ts';
import {holdingDecimals} from './valuation.ts';
import {historicalAdaPrice} from './transaction-amounts.ts';

export function transactionPrices(facts:Fact[],markets:Record<string,Market>,history:Record<string,number>,acquisitions:Acquisitions={}){
  const prices:Record<string,{usd:number;ada:number;time:number;hash:string;decimals:number}>={};
  for(const fact of [...facts].sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash))){
    const trade=tradeOf(fact);
    // Mint and explicitly linked payments establish cost, not current value.
    const candidates=trade&&!acquisitions[fact.hash]?.[trade.id]?[{...trade,time:fact.time,hash:fact.hash}]:[];
    for(const candidate of candidates){
    if(prices[candidate.id]||!Number.isFinite(candidate.time)||candidate.time<=0)continue;
    const decimals=holdingDecimals(markets[candidate.id],fact.decimals?.[candidate.id]);
    if(decimals==null||!Number.isInteger(decimals)||decimals<0||decimals>30)continue;
    const quantity=units(candidate.raw,decimals);
    const daily=historicalAdaPrice(candidate.time,history);
    if(!quantity||!Number.isFinite(quantity)||daily===null)continue;
    const ada=candidate.ada/quantity,usd=ada*daily;
    if(Number.isFinite(usd)&&usd>0)prices[candidate.id]={usd,ada,time:candidate.time,hash:candidate.hash,decimals};
    }
  }
  return prices;
}
