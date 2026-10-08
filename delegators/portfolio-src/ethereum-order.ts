import {ethereumAccountTransactions,type EthereumData,type EthereumWallet,type EthereumTransaction} from './ethereum.ts';

function sequence(ids:string[],edges:Map<string,Set<string>>){
  for(let i=1;i<ids.length;i++)if(ids[i-1]!==ids[i])edges.get(ids[i-1])!.add(ids[i]);
}
function ordered(ids:string[],edges:Map<string,Set<string>>):string[]|null{
  const degrees=new Map(ids.map(id=>[id,0]));
  for(const targets of edges.values())for(const target of targets)degrees.set(target,degrees.get(target)!+1);
  const result:string[]=[],ready=ids.filter(id=>degrees.get(id)===0);
  while(ready.length){
    // Neither hashes nor wallet-list order prove execution order.
    if(ready.length!==1)return null;
    const id=ready.pop()!;result.push(id);
    for(const target of edges.get(id)||[]){degrees.set(target,degrees.get(target)!-1);if(degrees.get(target)===0)ready.push(target);}
  }
  return result.length===ids.length?result:null;
}
function compareTrace(a:string,b:string){
  const left=a.split('_').map(BigInt),right=b.split('_').map(BigInt);
  for(let i=0;i<Math.min(left.length,right.length);i++)if(left[i]!==right[i])return left[i]<right[i]?-1:1;
  return left.length-right.length;
}

// Provider pages are ascending within each kind; indexes join normal and trace histories.
export function ethereumExecutionOrder(data:EthereumData,wallets:EthereumWallet[]):EthereumTransaction[]|null{
  const accounts=wallets.map(wallet=>ethereumAccountTransactions(data.accounts[wallet.address]?.transactions||[]));
  const rows=new Map<string,EthereumTransaction>(),blocks=new Map<number,Set<string>>(),indexes=new Map<string,number>();
  const groups=new Map<string,EthereumTransaction[]>(),blockSequences=new Map<number,string[][]>(),traceSequences=new Map<string,EthereumTransaction[][]>();
  for(const account of accounts)for(const tx of account){
    if(tx.transactionIndex!==undefined){
      if(indexes.has(tx.hash)&&indexes.get(tx.hash)!==tx.transactionIndex)return null;
      indexes.set(tx.hash,tx.transactionIndex);
    }
    if(!rows.has(tx.id)){
      rows.set(tx.id,tx);
      if(!groups.has(tx.hash))groups.set(tx.hash,[]);groups.get(tx.hash)!.push(tx);
    }
    if(!blocks.has(tx.block))blocks.set(tx.block,new Set());blocks.get(tx.block)!.add(tx.hash);
  }
  for(const account of accounts){
    const kinds=new Map<string,{block:number;hashes:Set<string>}>(),traces=new Map<string,EthereumTransaction[]>();
    for(const tx of account){
      const key=tx.block+':'+tx.kind;
      if(!kinds.has(key))kinds.set(key,{block:tx.block,hashes:new Set()});kinds.get(key)!.hashes.add(tx.hash);
      if(tx.kind==='internal'){if(!traces.has(tx.hash))traces.set(tx.hash,[]);traces.get(tx.hash)!.push(tx);}
    }
    for(const {block,hashes} of kinds.values()){
      if(!blockSequences.has(block))blockSequences.set(block,[]);blockSequences.get(block)!.push([...hashes]);
    }
    for(const [hash,own] of traces){
      if(!traceSequences.has(hash))traceSequences.set(hash,[]);traceSequences.get(hash)!.push(own);
    }
  }
  const result:EthereumTransaction[]=[];
  for(const [block,hashes] of [...blocks].sort(([a],[b])=>a-b)){
    const edges=new Map([...hashes].map(hash=>[hash,new Set<string>()]));
    const positioned=[...hashes].filter(hash=>indexes.has(hash)).sort((a,b)=>indexes.get(a)!-indexes.get(b)!);
    if(positioned.some((hash,i)=>i>0&&indexes.get(hash)===indexes.get(positioned[i-1])))return null;
    sequence(positioned,edges);
    for(const ids of blockSequences.get(block)||[])for(let i=1;i<ids.length;i++){
      if(!indexes.has(ids[i-1])||!indexes.has(ids[i]))edges.get(ids[i-1])!.add(ids[i]);
    }
    const hashOrder=ordered([...hashes],edges);if(!hashOrder)return null;
    for(const hash of hashOrder){
      const group=groups.get(hash)!,traces=group.filter(tx=>tx.kind==='internal');
      result.push(...group.filter(tx=>tx.kind==='normal'));
      const traceEdges=new Map(traces.map(tx=>[tx.id,new Set<string>()]));
      for(const own of traceSequences.get(hash)||[]){
        // Trace numbering is provider-local: never compare positions from two providers.
        if(own.every(tx=>tx.traceIndex!==undefined))own.sort((a,b)=>compareTrace(a.traceIndex!,b.traceIndex!));
        sequence(own.map(tx=>tx.id),traceEdges);
      }
      const traceOrder=ordered(traces.map(tx=>tx.id),traceEdges);if(!traceOrder)return null;
      result.push(...traceOrder.map(id=>rows.get(id)!));
    }
  }
  return result;
}
