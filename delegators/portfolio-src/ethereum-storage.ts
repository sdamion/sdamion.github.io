import {ethereumData,type EthereumData,type EthereumTransaction} from './ethereum.ts';
import {stringDictionary,expandBlock,CACHE_RECORDS_PER_PART} from './compact-storage.ts';

const TRANSACTIONS_PER_PART=CACHE_RECORDS_PER_PART;
export function compactEthereumPart(transactions:EthereumTransaction[]){
  const {strings:addresses,index:address}=stringDictionary();
  return JSON.stringify({addresses,transactions:transactions.map(tx=>[tx.hash,tx.kind==='normal'?0:1,tx.block,tx.time,address(tx.from),address(tx.to),tx.valueWei,tx.feeWei,tx.failed,tx.transactionIndex??null,tx.id.slice(tx.hash.length+1),tx.traceIndex??null])});
}
export function expandEthereumPart(raw:string):EthereumTransaction[]{
  const value=expandBlock(JSON.parse(raw));
  if(Array.isArray(value))return value;
  if(!Array.isArray(value?.addresses)||!value.addresses.every((address:unknown)=>typeof address==='string')||!Array.isArray(value.transactions))throw new Error('Invalid Ethereum cache part.');
  return value.transactions.map((row:unknown[])=>{
    if(!Array.isArray(row)||row.length!==12||![0,1].includes(row[1] as number)||!Number.isSafeInteger(row[4])||!Number.isSafeInteger(row[5])||typeof value.addresses[row[4] as number]!=='string'||typeof value.addresses[row[5] as number]!=='string')throw new Error('Invalid Ethereum cache part.');
    const [hash,kind,block,time,from,to,valueWei,feeWei,failed,transactionIndex,suffix,traceIndex]=row;
    return {hash,id:hash+':'+suffix,kind:kind===0?'normal':'internal',block,time,from:value.addresses[from as number],to:value.addresses[to as number],valueWei,feeWei,failed,...(transactionIndex!==null?{transactionIndex}:{}),...(traceIndex!==null?{traceIndex}:{})} as EthereumTransaction;
  });
}

// Upgrade already fetched partitions before upload, without fetching history again.
export function compactEthereumSettings(settings:Record<string,string>):Record<string,string>{
  const next={...settings};
  for(const [key,raw] of Object.entries(settings)){
    if(!/^tdsp-member-ethereum-data:[^:]+$/.test(key))continue;
    const value=JSON.parse(raw);
    if(value?.storageVersion===2)continue;
    if(value?.storageVersion===1){
      for(const [address,account] of Object.entries(value.accounts)){
        const parts=(account as {parts:number}).parts;
        if(!Number.isSafeInteger(parts)||parts<0)throw new Error('Invalid Ethereum cache index.');
        for(let part=0;part<parts;part++){
          const partKey=`${key}::${address}:${part}`;
          if(!Object.hasOwn(settings,partKey))throw new Error('Ethereum cache is incomplete. Saved data is retained.');
          next[partKey]=compactEthereumPart(expandEthereumPart(settings[partKey]));
        }
      }
      next[key]=JSON.stringify({...value,storageVersion:2});
    }else if(value?.accounts){
      Object.assign(next,encodeEthereumSettings(key,ethereumData(value)));
    }
  }
  return next;
}
export function encodeEthereumSettings(key:string,data:EthereumData):Record<string,string>{
  if(Object.values(data.accounts).reduce((sum,row)=>sum+row.transactions.length,0)<=TRANSACTIONS_PER_PART)return {[key]:JSON.stringify(data)};
  const settings:Record<string,string>={},accounts:Record<string,unknown>={};
  for(const [address,account] of Object.entries(data.accounts)){
    const {transactions,...header}=account;
    const parts=Math.ceil(transactions.length/TRANSACTIONS_PER_PART);
    accounts[address]={...header,parts};
    for(let part=0;part<parts;part++)settings[`${key}::${address}:${part}`]=compactEthereumPart(transactions.slice(part*TRANSACTIONS_PER_PART,(part+1)*TRANSACTIONS_PER_PART));
  }
  settings[key]=JSON.stringify({...data,accounts,storageVersion:2});
  return settings;
}

export function readEthereumSettings(key:string,get:(key:string)=>string|null,addresses?:Set<string>):EthereumData{
  const value=JSON.parse(get(key)||'null');
  if(value?.storageVersion!==1&&value?.storageVersion!==2)return ethereumData(addresses&&value?.accounts?{...value,accounts:Object.fromEntries(Object.entries(value.accounts).filter(([address])=>addresses.has(address)))}:value);
  if(!value.accounts||typeof value.accounts!=='object')throw new Error('Invalid Ethereum cache index.');
  const accounts:Record<string,unknown>={};
  for(const [address,account] of Object.entries(value.accounts)){
    if(addresses&&!addresses.has(address))continue;
    const row=account as {parts:number};
    if(!Number.isSafeInteger(row.parts)||row.parts<0)throw new Error('Invalid Ethereum cache index.');
    const transactions:EthereumTransaction[]=[];
    for(let part=0;part<row.parts;part++){
      const raw=get(`${key}::${address}:${part}`);
      if(raw===null)throw new Error('Ethereum cache is incomplete. Saved data is retained.');
      const rows=expandEthereumPart(raw);
      if(!Array.isArray(rows)||rows.length>TRANSACTIONS_PER_PART)throw new Error('Invalid Ethereum cache part.');
      for(const tx of rows)transactions.push(tx);
    }
    const {parts,...header}=row;
    accounts[address]={...header,transactions};
  }
  return ethereumData({...value,accounts});
}
