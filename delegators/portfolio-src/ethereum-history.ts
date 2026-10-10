import {validEthereumTransaction,type EthereumTransaction} from './ethereum.ts';

type Range={startBlock:number;endBlock:number};
type Page={transactions:EthereumTransaction[];more:boolean};
export type EthereumHistoryCheckpoints=Map<string,{startBlock:number;endBlock:number;transactions:EthereumTransaction[]}>;

// Split only explicitly rejected windows; incomplete ranges never become checkpoints.
export async function ethereumHistory(range:Range,request:(range:Range&{page:number})=>Promise<Page>,completed:EthereumHistoryCheckpoints=new Map(),maxRequests=Infinity,maxTransactions=Infinity,onTransactions?:(transactions:EthereumTransaction[])=>void,onCheckpoint?:(range:Range&{transactions:EthereumTransaction[]})=>Promise<void>):Promise<EthereumTransaction[]>{
  let calls=0;
  async function remember(current:Range,records:Map<string,EthereumTransaction>){
    const checkpoint={...current,transactions:[...records.values()]};
    await onCheckpoint?.(checkpoint);
    for(const [key,previous] of completed)if(previous.startBlock===current.startBlock&&previous.endBlock<=current.endBlock)completed.delete(key);
    completed.set(`${current.startBlock}:${current.endBlock}`,checkpoint);
  }
  async function scan(current:Range):Promise<Map<string,EthereumTransaction>>{
    const prefix=[...completed.values()].filter(row=>row.startBlock===current.startBlock&&row.endBlock<=current.endBlock).sort((a,b)=>b.endBlock-a.endBlock)[0];
    if(prefix){
      onTransactions?.(prefix.transactions);
      const records=new Map(prefix.transactions.map(tx=>[tx.id,tx]));
      if(prefix.endBlock<current.endBlock){
        const remaining=await scan({startBlock:prefix.endBlock+1,endBlock:current.endBlock});
        for(const [id,tx] of remaining)records.set(id,tx);
      }
      if(records.size>maxTransactions)throw new Error('Ethereum history is too large. Saved data is retained.');
      return records;
    }
    const records=new Map<string,EthereumTransaction>();
    const pages=new Set<string>();
    let lastBlock=current.startBlock;
    for(let page=1;;page++){
      if(++calls>maxRequests)throw Object.assign(new Error('Ethereum history is incomplete. Saved data is retained.'),{code:'history_scan_budget'});
      let result:Page;
      try{result=await request({...current,page});}
      catch(error){
        if((error as {code?:string}).code!=='history_window_limit'||current.startBlock===current.endBlock)throw error;
        // Accepted ascending pages prove the prefix before their last block.
        // Re-read that boundary block; do not discard and download the prefix again.
        if(lastBlock>current.startBlock){
          for(const [id,tx] of records)if(tx.block>=lastBlock)records.delete(id);
          await remember({startBlock:current.startBlock,endBlock:lastBlock-1},records);
          const remaining=await scan({startBlock:lastBlock,endBlock:current.endBlock});
          for(const [id,tx] of remaining)records.set(id,tx);
          if(records.size>maxTransactions)throw new Error('Ethereum history is too large. Saved data is retained.');
          return records;
        }
        const middle=Math.floor((current.startBlock+current.endBlock)/2);
        const left=await scan({startBlock:current.startBlock,endBlock:middle});
        const right=await scan({startBlock:middle+1,endBlock:current.endBlock});
        for(const [id,tx] of right)left.set(id,tx);
        if(left.size>maxTransactions)throw new Error('Ethereum history is too large. Saved data is retained.');
        return left;
      }
      if(!Array.isArray(result.transactions)||result.transactions.length>1000||!result.transactions.every(tx=>validEthereumTransaction(tx)&&tx.block>=current.startBlock&&tx.block<=current.endBlock)||typeof result.more!=='boolean')throw new Error('Invalid Ethereum history response.');
      if(result.more){
        const signature=JSON.stringify(result.transactions.map(tx=>[tx.id,tx.block]));
        if(!result.transactions.length||pages.has(signature))throw new Error('Invalid Ethereum history response.');
        pages.add(signature);
      }
      for(const tx of result.transactions){
        if(tx.block<lastBlock)throw new Error('Invalid Ethereum history response.');
        lastBlock=tx.block;
      }
      for(const tx of result.transactions)records.set(tx.id,tx);
      onTransactions?.(result.transactions);
      if(records.size>maxTransactions)throw new Error('Ethereum history is too large. Saved data is retained.');
      if(!result.more){await remember(current,records);return records;}
      if(page!==10&&lastBlock>current.startBlock){
        const prefix=new Map([...records].filter(([,tx])=>tx.block<lastBlock));
        await remember({startBlock:current.startBlock,endBlock:lastBlock-1},prefix);
      }
      // Page 11 at 1,000 records crosses the common 10,000-record window.
      // Re-read the boundary block so equal-block transactions cannot be skipped.
      if(page===10&&current.startBlock<current.endBlock){
        const blocks=[...records.values()].map(tx=>tx.block);
        const boundary=Math.max(current.startBlock,...blocks);
        if(boundary>current.startBlock){
          for(const [id,tx] of records)if(tx.block>=boundary)records.delete(id);
          await remember({startBlock:current.startBlock,endBlock:boundary-1},records);
          const remaining=await scan({startBlock:boundary,endBlock:current.endBlock});
          for(const [id,tx] of remaining)records.set(id,tx);
          if(records.size>maxTransactions)throw new Error('Ethereum history is too large. Saved data is retained.');
          return records;
        }
        const middle=Math.floor((current.startBlock+current.endBlock)/2);
        const left=await scan({startBlock:current.startBlock,endBlock:middle});
        const right=await scan({startBlock:middle+1,endBlock:current.endBlock});
        for(const [id,tx] of right)left.set(id,tx);
        if(left.size>maxTransactions)throw new Error('Ethereum history is too large. Saved data is retained.');
        return left;
      }
    }
  }
  const records=await scan(range);
  return [...records.values()];
}
