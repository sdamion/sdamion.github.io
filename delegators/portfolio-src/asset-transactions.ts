import {tradeOf} from './core.ts';
import type {Fact,Acquisitions} from './core.ts';

export function assetTransactions(id:string,facts:Fact[],acquisitions:Acquisitions){
  return [...new Map(facts.map(f=>[f.hash,f])).values()]
    .filter(f=>BigInt(f.assets[id]||'0')!==0n)
    .sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash))
    .map(f=>{
      const raw=f.assets[id],acquisition=acquisitions[f.hash]?.[id],trade=tradeOf(f);
      const buy=trade?.id===id&&trade.side==='buy';
      return {
        hash:f.hash,time:f.time,raw,
        kind:acquisition?'Linked purchase':buy?'Buy':trade?.id===id&&trade.side==='sell'?'Sell':BigInt(raw)<0n?'Sent':f.minted?.[id]===raw?'Mint received':'Received',
        paymentHash:acquisition?.paymentHash??(buy?f.hash:null),
        costAda:acquisition?.ada??(buy?trade.costAda:null),
        costKnown:!!acquisition||buy
      };
    });
}
