import type {Fact} from './core';

export function purchaseRefreshBatches(facts:Pick<Fact,'hash'|'assets'>[],assetIds:string[]):string[][]{
  const ids=new Set(assetIds.filter(id=>id!=='lovelace'));
  const hashes=[...new Set(facts.filter(f=>Object.entries(f.assets).some(([id,raw])=>ids.has(id)&&BigInt(raw)>0n)).map(f=>f.hash))];
  const batches:string[][]=[];
  for(let i=0;i<hashes.length;i+=5)batches.push(hashes.slice(i,i+5));
  return batches;
}
