import {cexTimeline} from './cex.ts';
import type {CexAddress} from './cex.ts';
import type {Fact} from './core.ts';

export function cexBtcSeries(facts:Fact[],entries:CexAddress[],adaHistory:Record<string,number>,btcHistory:Record<string,number>){
  let incoming:number|null=0,outgoing:number|null=0,missing=0;
  return cexTimeline(facts,entries,adaHistory).reverse().map(row=>{
    const price=btcHistory[new Date(row.time*1000).toISOString().slice(0,10)];
    const value=row.usd!==null&&Number.isFinite(price)&&price>0?row.usd/price:null;
    if(value===null)missing++;
    if(row.side==='buy')incoming=incoming===null||value===null?null:incoming+value;
    else outgoing=outgoing===null||value===null?null:outgoing+value;
    return {time:row.time,incoming,outgoing,missing};
  });
}
