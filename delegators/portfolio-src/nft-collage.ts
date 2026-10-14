import {tradeOf,short} from './core.ts';
import type {Fact,Acquisitions} from './core.ts';
import {collectionName,collectionRepresentative} from './holding-groups.ts';
import {matchesSearchText} from './transaction-search.ts';
import type {historicalNfts} from './historical-nfts';

export type NftPrices=Record<string,{buy:number|null;sell:number|null}>;
export type NftSort='date'|'buy-high'|'buy-low'|'sell-high'|'sell-low';
const collectionNames:Record<string,string>={
  f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a:'ADA Handle',
  '6c32db33a422e0bc2cb535bb850b5a6e9a9572222056d6ddc9cbc26e':'ADA Handle',
};
const collectionNameHints=new Map([
  ['101 stanhope terrace, ko71r','The Ape Society Cabins'],
  ['101 stanhope terrace, ko71 r','The Ape Society Cabins'],
  ['ape society frame level','The Ape Society Frames'],
  ['aesho of devilube','Jelly Cubes'],
  ['ailen hill','The Ape Society V2'],
  ['the ape society','The Ape Society V2'],
  ['adonis brown','The Ape Society V1'],
  ['air','ADA Clouds'],
  ['alden garrison','Strongholds by House Of Titans'],
  ['amulet of influence','The Mallard Order - Relics'],
]);
export function historicalNftPrices(facts:Fact[],acquisitions:Acquisitions={}):NftPrices{
  const result:NftPrices={},times=new Map<string,number>();
  const record=(id:string,side:'buy'|'sell',amount:number,time:number,raw:string)=>{
    const quantity=Number(raw),price=amount/quantity;
    if(!Number.isFinite(price)||price<0||!Number.isSafeInteger(quantity)||quantity<=0||!Number.isFinite(time))return;
    const key=id+':'+side;
    if(time<(times.get(key)??-Infinity))return;
    times.set(key,time);(result[id]??={buy:null,sell:null})[side]=price;
  };
  for(const fact of [...new Map(facts.map(fact=>[fact.hash,fact])).values()].sort((a,b)=>a.time-b.time||a.hash.localeCompare(b.hash))){
    if(fact.internal)continue;
    const trade=tradeOf(fact);
    for(const [id,raw] of Object.entries(fact.assets)){
      const acquisition=acquisitions[fact.hash]?.[id];
      if(/^\d+$/.test(raw)&&BigInt(raw)>0n&&acquisition)record(id,'buy',acquisition.ada,acquisition.time,raw);
      else if(trade?.id===id&&trade.side==='buy')record(id,'buy',trade.costAda,fact.time,trade.raw);
    }
    if(trade?.side==='sell')record(trade.id,'sell',trade.ada,fact.time,trade.raw);
  }
  return result;
}
export function nftCollections(rows:ReturnType<typeof historicalNfts>){
  const groups=new Map<string,typeof rows>();
  for(const row of rows){const policy=row.id.slice(0,56);const assets=groups.get(policy)||[];assets.push(row);groups.set(policy,assets);}
  return [...groups].map(([policy,assets])=>({policy,count:assets.length,name:collectionNames[policy]||assets.map(asset=>collectionNameHints.get(collectionName(asset.name).trim().toLowerCase())).find(Boolean)||collectionRepresentative(assets)?.name||short(policy)})).sort((a,b)=>a.name.localeCompare(b.name)||a.policy.localeCompare(b.policy));
}
export function filterNftCollage(rows:ReturnType<typeof historicalNfts>,prices:NftPrices,wallets:Record<string,string[]>,query:string,collection:string,sort:NftSort){
  return rows.filter(row=>(!collection||row.id.slice(0,56)===collection)&&matchesSearchText(query,[row.name,row.id,...wallets[row.id]||[]])).sort((a,b)=>{
    const tie=(b.firstReceived??0)-(a.firstReceived??0)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
    if(sort==='date')return tie;
    const side=sort.startsWith('buy')?'buy':'sell',left=prices[a.id]?.[side]??null,right=prices[b.id]?.[side]??null;
    if(left===null||right===null)return left===right?tie:left===null?1:-1;
    return (sort.endsWith('high')?right-left:left-right)||tie;
  });
}
