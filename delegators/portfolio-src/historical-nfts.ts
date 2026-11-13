import type {Fact,Holding,Market} from './core';
import {assetIsNft,type OwnedAsset} from './owned-assets.ts';
import {sortAssetsByDate} from './asset-dates.ts';
export type HistoricalNftRow={id:string;name:string;raw:string;firstReceived:number|null;image?:string|null;chain?:OwnedAsset['chain'];wallets?:string[];ordinal?:{id:string;number:number|null;contentType:string|null;collection:string|null;ownedWallets:string[]}};

export function mergeHistoricalNfts(history:HistoricalNftRow[],owned:(OwnedAsset&{wallets:string[];firstReceived?:number|null})[]):HistoricalNftRow[]{
  const rows=new Map(history.map(row=>[row.id,row]));
  for(const asset of owned){
    if(!assetIsNft(asset)||BigInt(asset.raw)===0n)continue;
    const id=asset.chain==='cardano'?asset.id.slice('cardano:'.length):asset.id;
    const previous=rows.get(id);
    rows.set(id,previous?{...previous,firstReceived:previous.firstReceived??asset.firstReceived??null,image:asset.image||previous.image,wallets:asset.wallets}:{id,name:asset.name,raw:asset.raw,firstReceived:asset.firstReceived??null,image:asset.image,chain:asset.chain,wallets:asset.wallets});
  }
  return sortAssetsByDate([...rows.values()]);
}

export function historicalNfts(facts:Fact[],holdings:Holding[],markets:Record<string,Market>):HistoricalNftRow[]{
  const balances=new Map(holdings.map(row=>[row.id,row.raw]));
  const ids=new Set(holdings.map(row=>row.id));
  const received=new Map<string,number>();
  for(const fact of facts)for(const [id,raw] of Object.entries(fact.assets)){
    ids.add(id);
    if(/^[0-9]+$/.test(raw)&&BigInt(raw)>0n&&Number.isFinite(fact.time)&&fact.time>0&&Number.isFinite(new Date(fact.time*1000).getTime())){
      received.set(id,Math.min(received.get(id)??Infinity,fact.time));
    }
  }
  return [...ids].filter(id=>markets[id]?.is_nft===true)
    .map(id=>({id,name:markets[id]?.name||markets[id]?.ticker||id,raw:balances.get(id)||'0',firstReceived:received.get(id)??null}))
    .sort((a,b)=>(b.firstReceived??0)-(a.firstReceived??0)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
