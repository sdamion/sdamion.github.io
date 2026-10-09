import {validEthereumTransaction,type EthereumTransaction} from './ethereum.ts';

type Range={startBlock:number;endBlock:number};
type Page={transactions:EthereumTransaction[];more:boolean};

// Split only explicitly rejected windows; incomplete ranges never become checkpoints.
export async function ethereumHistory(range:Range,request:(range:Range&{page:number})=>Promise<Page>):Promise<EthereumTransaction[]>{
  let calls=0;
  async function scan(current:Range):Promise<Map<string,EthereumTransaction>>{
    const records=new Map<string,EthereumTransaction>();
    for(let page=1;page<=100;page++){
      if(++calls>300)throw new Error('Ethereum history is incomplete. Saved data is retained.');
      let result:Page;
      try{result=await request({...current,page});}
      catch(error){
        if((error as {code?:string}).code!=='history_window_limit'||current.startBlock===current.endBlock)throw error;
        const middle=Math.floor((current.startBlock+current.endBlock)/2);
        const left=await scan({startBlock:current.startBlock,endBlock:middle});
        const right=await scan({startBlock:middle+1,endBlock:current.endBlock});
        for(const [id,tx] of right)left.set(id,tx);
        if(left.size>100000)throw new Error('Ethereum history is too large. Saved data is retained.');
        return left;
      }
      if(!Array.isArray(result.transactions)||!result.transactions.every(tx=>validEthereumTransaction(tx)&&tx.block>=current.startBlock&&tx.block<=current.endBlock)||typeof result.more!=='boolean')throw new Error('Invalid Ethereum history response.');
      for(const tx of result.transactions)records.set(tx.id,tx);
      if(records.size>100000)throw new Error('Ethereum history is too large. Saved data is retained.');
      if(!result.more)return records;
    }
    throw new Error('Ethereum history is incomplete. Saved data is retained.');
  }
  const records=await scan(range);
  return [...records.values()];
}
