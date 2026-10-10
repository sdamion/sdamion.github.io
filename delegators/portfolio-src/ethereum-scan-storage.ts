import {compactEthereumPart,expandEthereumPart} from './ethereum-storage.ts';
import {CACHE_RECORDS_PER_PART} from './compact-storage.ts';
import {validEthereumAddress,validEthereumTransaction,type EthereumTransaction} from './ethereum.ts';
import type {EthereumHistoryCheckpoints} from './ethereum-history.ts';

type Checkpoint={startBlock:number;endBlock:number;transactions:EthereumTransaction[]};
export function encodeEthereumScanCheckpoint(prefix:string,scope:string,range:Checkpoint):Record<string,string>{
  const key=`${prefix}::${scope}::${range.startBlock}`;
  const parts=Math.ceil(range.transactions.length/CACHE_RECORDS_PER_PART),values:Record<string,string>={};
  for(let part=0;part<parts;part++)values[`${key}::${part}`]=compactEthereumPart(range.transactions.slice(part*CACHE_RECORDS_PER_PART,(part+1)*CACHE_RECORDS_PER_PART));
  values[key]=JSON.stringify({startBlock:range.startBlock,endBlock:range.endBlock,parts});
  return values;
}
// Scan receipts are encrypted settings, separate from completed accounts and financial totals.
export function readEthereumScanCheckpoints(prefix:string,keys:string[],get:(key:string)=>string|null){
  const result=new Map<string,EthereumHistoryCheckpoints>();
  for(const key of keys){
    if(!key.startsWith(prefix+'::'))continue;
    const match=/^(0x[0-9a-f]{40}):(normal|internal):(etherscan|blockscout):(\d+)::(\d+)$/.exec(key.slice(prefix.length+2));
    if(!match)continue;
    const [,address,kind,provider,start,startBlock]=match,scope=`${address}:${kind}:${provider}:${start}`;
    const row=JSON.parse(get(key)||'null');
    if(!validEthereumAddress(address)||!row||row.startBlock!==Number(startBlock)||!Number.isSafeInteger(row.startBlock)||row.startBlock<Number(start)||!Number.isSafeInteger(row.endBlock)||row.endBlock<row.startBlock||!Number.isSafeInteger(row.parts)||row.parts<0||row.parts>keys.length)throw new Error('Invalid Ethereum scan checkpoint.');
    const transactions:EthereumTransaction[]=[];
    for(let part=0;part<row.parts;part++){
      const raw=get(`${key}::${part}`);if(raw===null)throw new Error('Ethereum scan checkpoint is incomplete. Saved data is retained.');
      const rows=expandEthereumPart(raw);
      if(rows.length>CACHE_RECORDS_PER_PART||!rows.every(tx=>validEthereumTransaction(tx)&&tx.kind===kind&&tx.block>=row.startBlock&&tx.block<=row.endBlock&&(tx.from===address||tx.to===address)))throw new Error('Invalid Ethereum scan checkpoint.');
      for(const tx of rows)transactions.push(tx);
    }
    if(!result.has(scope))result.set(scope,new Map());
    result.get(scope)!.set(`${row.startBlock}:${row.endBlock}`,{startBlock:row.startBlock,endBlock:row.endBlock,transactions});
  }
  return result;
}
