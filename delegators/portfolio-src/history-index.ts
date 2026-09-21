import type {Tx} from './core.ts';

export function createHistoryIndex(cached:Tx[],incremental:boolean){
  const known=new Set(cached.map(tx=>tx.tx_hash));
  const records=new Map(cached.map(tx=>[tx.tx_hash,tx]));
  const seen=new Set<string>();
  return {
    get size(){return records.size;},
    add(page:Tx[]){
      const reachedSavedHistory=incremental&&page.length>0&&page.every(tx=>known.has(tx.tx_hash));
      const discovered:Tx[]=[];
      for(const tx of page){
        records.set(tx.tx_hash,tx);
        if(!seen.has(tx.tx_hash)){seen.add(tx.tx_hash);discovered.push(tx);}
      }
      return {discovered,reachedSavedHistory};
    },
    rows(){return [...records.values()].sort((a,b)=>b.block_time-a.block_time||a.tx_hash.localeCompare(b.tx_hash));}
  };
}
