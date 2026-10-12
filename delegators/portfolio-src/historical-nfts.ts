import type {Fact,Holding,Market} from './core';

export function historicalNfts(facts:Fact[],holdings:Holding[],markets:Record<string,Market>){
  const balances=new Map(holdings.map(row=>[row.id,row.raw]));
  const ids=new Set(holdings.map(row=>row.id));
  for(const fact of facts)for(const id of Object.keys(fact.assets))ids.add(id);
  return [...ids].filter(id=>markets[id]?.is_nft===true)
    .map(id=>({id,name:markets[id]?.name||markets[id]?.ticker||id,raw:balances.get(id)||'0'}))
    .sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
