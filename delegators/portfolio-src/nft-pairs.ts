import type {NftEvent} from './nft-history';

export type NftTradePair={id:string;acquisition:NftEvent;sale:NftEvent};
export function nftTradePairs(events:NftEvent[]):NftTradePair[]{
  const pending=new Map<string,NftEvent|null>(),pairs:NftTradePair[]=[];
  const unique=new Map(events.map(event=>[event.id+':'+event.hash,event]));
  for(const event of [...unique.values()].sort((a,b)=>a.time-b.time||a.hash.localeCompare(b.hash))){
    if(event.kind==='Internal transfer')continue;
    if((event.kind==='Buy'||event.kind==='Mint')&&event.raw==='1'){
      pending.set(event.id,pending.has(event.id)?null:event);continue;
    }
    const acquisition=pending.get(event.id);
    if(event.kind==='Sell'&&event.raw==='-1'&&acquisition&&event.time>acquisition.time)pairs.push({id:event.id,acquisition,sale:event});
    pending.delete(event.id);
  }
  return pairs;
}

// Never show a previous sale beside a subsequent repurchase of the same NFT.
export function nftCyclePrices(events:NftEvent[]){
  const pairs=new Map(nftTradePairs(events).map(pair=>[pair.id+':'+pair.sale.hash,pair])),latest=new Map<string,NftEvent>();
  for(const event of events){
    if(event.kind==='Internal transfer')continue;
    const previous=latest.get(event.id);
    if(!previous||event.time>previous.time||event.time===previous.time&&event.hash>previous.hash)latest.set(event.id,event);
  }
  return Object.fromEntries([...latest].map(([id,event])=>{
    const pair=pairs.get(id+':'+event.hash);
    const acquisition=pair?.acquisition||(['Buy','Mint'].includes(event.kind)?event:null);
    return [id,{buy:acquisition?.price??null,sell:event.kind==='Sell'?event.price:null,acquisition:acquisition?.kind==='Mint'?'Mint' as const:'Buy' as const}];
  }));
}

type TransactionLike={chain:string;tx:{tx_hash?:string}};
export function groupNftRows<T extends TransactionLike>(groups:T[][],pairs:NftTradePair[]){
  const eligible=new Map(groups.filter(group=>group.length===1&&group[0].chain==='cardano').map(group=>[group[0].tx.tx_hash!,group[0]]));
  const memberships=new Map<string,NftTradePair[]>();
  for(const pair of pairs)for(const hash of [pair.acquisition.hash,pair.sale.hash])memberships.set(hash,[...memberships.get(hash)||[],pair]);
  const used=new Set<string>(),result:{rows:T[];nft?:NftTradePair}[]=[];
  for(const rows of groups){
    const hash=rows.length===1&&rows[0].chain==='cardano'?rows[0].tx.tx_hash:undefined;
    if(hash&&used.has(hash))continue;
    const pair=hash&&memberships.get(hash)?.length===1?memberships.get(hash)![0]:undefined;
    if(pair&&memberships.get(pair.acquisition.hash)?.length===1&&memberships.get(pair.sale.hash)?.length===1&&eligible.has(pair.acquisition.hash)&&eligible.has(pair.sale.hash)&&!used.has(pair.acquisition.hash)&&!used.has(pair.sale.hash)){
      used.add(pair.acquisition.hash);used.add(pair.sale.hash);
      result.push({rows:[eligible.get(pair.acquisition.hash)!,eligible.get(pair.sale.hash)!],nft:pair});
    }else result.push({rows});
  }
  return result;
}
