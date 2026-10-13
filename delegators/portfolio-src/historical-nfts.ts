import type {Fact,Holding,Market} from './core';

export function historicalNfts(facts:Fact[],holdings:Holding[],markets:Record<string,Market>){
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
