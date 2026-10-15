import {tradeOf} from './core.ts';
import type {Acquisitions,Fact} from './core.ts';
import {nftCollections} from './nft-collage.ts';
import type {historicalNfts} from './historical-nfts.ts';

export type NftEvent={id:string;hash:string;time:number;name:string;raw:string;kind:'Buy'|'Sell'|'Mint'|'Burn'|'Received'|'Sent'|'Internal transfer';price:number|null};
export function nftTransactions(rows:ReturnType<typeof historicalNfts>,facts:Fact[],acquisitions:Acquisitions={}):NftEvent[]{
  const names=new Map(rows.map(row=>[row.id,row.name])),events:NftEvent[]=[];
  for(const fact of new Map(facts.map(fact=>[fact.hash,fact])).values()){
    if(!Number.isFinite(fact.time)||fact.time<=0||!Number.isFinite(new Date(fact.time*1000).getTime()))continue;
    const trade=tradeOf(fact);
    for(const [id,raw] of Object.entries(fact.assets)){
      if(!names.has(id)||! /^-?\d+$/.test(raw)||BigInt(raw)===0n)continue;
      const delta=BigInt(raw),incoming=delta>0n,quantity=Number(incoming?delta:-delta),allocation=acquisitions[fact.hash]?.[id];
      const minted= /^\d+$/.test(fact.minted?.[id]||'')&&BigInt(fact.minted![id])>0n;
      const mint=incoming&&(minted||allocation?.source==='mint'||allocation?.source==='linked-mint');
      const burn=!incoming&& /^-\d+$/.test(fact.source?.assets_minted?.find(asset=>asset.policy_id+asset.asset_name===id)?.quantity||'');
      const cost=incoming?allocation?.ada??(trade?.id===id&&trade.side==='buy'?trade.costAda:null):trade?.id===id&&trade.side==='sell'?trade.ada:null;
      const price=cost!==null&&Number.isFinite(cost)&&cost>=0&&Number.isSafeInteger(quantity)&&quantity>0?cost/quantity:null;
      const kind=fact.internal?'Internal transfer':mint?'Mint':burn?'Burn':incoming?price!==null?'Buy':'Received':price!==null?'Sell':'Sent';
      events.push({id,hash:fact.hash,time:fact.time,name:names.get(id)!,raw,kind,price});
    }
  }
  return events.sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash)||a.id.localeCompare(b.id));
}
export function nftHighlights(rows:ReturnType<typeof historicalNfts>,events:NftEvent[]){
  const top=[...nftCollections(rows)].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)||a.policy.localeCompare(b.policy))[0]??null;
  const bought=new Map<string,NftEvent>();
  let fastest:{name:string;seconds:number;id:string}|null=null;
  // Only uninterrupted single-unit purchases qualify; unknown transfers cannot establish a flip.
  for(const event of [...events].sort((a,b)=>a.time-b.time||a.hash.localeCompare(b.hash)||a.id.localeCompare(b.id))){
    if(event.kind==='Internal transfer')continue;
    const buy=bought.get(event.id);
    if(event.kind==='Sell'&&event.raw==='-1'&&buy&&event.time>buy.time){
      const seconds=event.time-buy.time;
      if(!fastest||seconds<fastest.seconds)fastest={name:event.name,seconds,id:event.id};
    }
    bought.delete(event.id);
    if(event.kind==='Buy'&&event.raw==='1')bought.set(event.id,event);
  }
  return {top,fastest};
}
