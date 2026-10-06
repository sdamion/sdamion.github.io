import {cexTimeline} from './cex.ts';
import type {CexAddress} from './cex.ts';
import type {Fact} from './core.ts';
import {historicalAdaPrice} from './transaction-amounts.ts';

export type ComparisonCrypto='ADA'|'BTC';
export type ComparisonFiat='USD'|'EUR'|'JPY';
export type FxHistory=Record<string,Partial<Record<'EUR'|'JPY',number>>>;
// ECB does not publish weekend/holiday rates. Use only a recent prior rate.
export function datedRate(time:number,rates:Record<string,number>):number|null{
  for(let offset=0;offset<7;offset++){
    const value=rates[new Date((time-offset*86400)*1000).toISOString().slice(0,10)];
    if(Number.isFinite(value)&&value>0)return value;
  }
  return null;
}
export function fiatRate(time:number,currency:ComparisonFiat,history:FxHistory):number|null{
  if(currency==='USD')return 1;
  for(let offset=0;offset<7;offset++){
    const rate=history[new Date((time-offset*86400)*1000).toISOString().slice(0,10)]?.[currency];
    if(rate!=null&&Number.isFinite(rate)&&rate>0)return rate;
  }
  return null;
}
export function transferFiatValue(amount:number|null,unitUsd:number|null,rate:number|null):number|null{
  if(amount===null||unitUsd===null||rate===null)return null;
  const value=amount*unitUsd*rate;
  return Number.isFinite(value)?value:null;
}
export function transferComparison(facts:Fact[],entries:CexAddress[],adaHistory:Record<string,number>,btcHistory:Record<string,number>,fx:FxHistory,crypto:ComparisonCrypto,currency:ComparisonFiat){
  let incoming:number|null=0,outgoing:number|null=0,inFiat:number|null=0,outFiat:number|null=0;
  const add=(total:number|null,value:number|null)=>total===null||value===null?null:total+value;
  return cexTimeline(facts,entries,adaHistory).reverse().map(row=>{
    const btc=btcHistory[new Date(row.time*1000).toISOString().slice(0,10)];
    const unitUsd=crypto==='ADA'?historicalAdaPrice(row.time,adaHistory):Number.isFinite(btc)&&btc>0?btc:null;
    const amount=crypto==='ADA'?row.ada:row.usd!==null&&Number.isFinite(btc)&&btc>0?row.usd/btc:null;
    const rate=fiatRate(row.time,currency,fx),value=transferFiatValue(amount,unitUsd,rate);
    if(row.side==='buy'){incoming=add(incoming,amount);inFiat=add(inFiat,value);}
    else{outgoing=add(outgoing,amount);outFiat=add(outFiat,value);}
    return {time:row.time,incoming,outgoing,inFiat,outFiat};
  });
}
export function comparisonNet(last:ReturnType<typeof transferComparison>[number]|undefined,walletAda:number,currentAdaUsd:number|null,btcHistory:Record<string,number>,fx:FxHistory,crypto:ComparisonCrypto,currency:ComparisonFiat,time:number,portfolioUsd:number|null=currentAdaUsd!==null?walletAda*currentAdaUsd:null){
  const rate=fiatRate(time,currency,fx),btc=datedRate(time,btcHistory);
  const unitUsd=crypto==='ADA'?currentAdaUsd:btc;
  const walletCrypto=portfolioUsd!==null&&unitUsd!==null&&unitUsd>0?portfolioUsd/unitUsd:null;
  const walletFiat=portfolioUsd!==null&&rate!==null?portfolioUsd*rate:null;
  const totals=last??{incoming:0,outgoing:0,inFiat:0,outFiat:0};
  return {
    amount:walletCrypto!==null&&totals.incoming!==null&&totals.outgoing!==null?totals.incoming-(totals.outgoing+walletCrypto):null,
    fiat:walletFiat!==null&&totals.inFiat!==null&&totals.outFiat!==null?totals.inFiat-(totals.outFiat+walletFiat):null
  };
}
