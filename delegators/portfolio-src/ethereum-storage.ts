import {ethereumData,type EthereumData,type EthereumTransaction} from './ethereum.ts';

const TRANSACTIONS_PER_PART=10000;
export function encodeEthereumSettings(key:string,data:EthereumData):Record<string,string>{
  if(Object.values(data.accounts).reduce((sum,row)=>sum+row.transactions.length,0)<=TRANSACTIONS_PER_PART)return {[key]:JSON.stringify(data)};
  const settings:Record<string,string>={},accounts:Record<string,unknown>={};
  for(const [address,account] of Object.entries(data.accounts)){
    const {transactions,...header}=account;
    const parts=Math.ceil(transactions.length/TRANSACTIONS_PER_PART);
    accounts[address]={...header,parts};
    for(let part=0;part<parts;part++)settings[`${key}::${address}:${part}`]=JSON.stringify(transactions.slice(part*TRANSACTIONS_PER_PART,(part+1)*TRANSACTIONS_PER_PART));
  }
  settings[key]=JSON.stringify({...data,accounts,storageVersion:1});
  return settings;
}

export function readEthereumSettings(key:string,get:(key:string)=>string|null):EthereumData{
  const value=JSON.parse(get(key)||'null');
  if(value?.storageVersion!==1)return ethereumData(value);
  if(!value.accounts||typeof value.accounts!=='object')throw new Error('Invalid Ethereum cache index.');
  const accounts:Record<string,unknown>={};
  for(const [address,account] of Object.entries(value.accounts)){
    const row=account as {parts:number};
    if(!Number.isSafeInteger(row.parts)||row.parts<0)throw new Error('Invalid Ethereum cache index.');
    const transactions:EthereumTransaction[]=[];
    for(let part=0;part<row.parts;part++){
      const raw=get(`${key}::${address}:${part}`);
      if(raw===null)throw new Error('Ethereum cache is incomplete. Saved data is retained.');
      const rows=JSON.parse(raw);
      if(!Array.isArray(rows)||rows.length>TRANSACTIONS_PER_PART)throw new Error('Invalid Ethereum cache part.');
      for(const tx of rows)transactions.push(tx);
    }
    const {parts,...header}=row;
    accounts[address]={...header,transactions};
  }
  return ethereumData({...value,accounts});
}
