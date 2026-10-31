import {bitcoinData,type BitcoinData} from './bitcoin.ts';
import {compactBlock,expandBlock,CACHE_RECORDS_PER_PART} from './compact-storage.ts';

export function encodeBitcoinSettings(key:string,data:BitcoinData){
  const settings:Record<string,string>={},accounts:Record<string,unknown>={};
  for(const [address,{transactions,...header}] of Object.entries(data.accounts)){
    const parts=Math.ceil(transactions.length/CACHE_RECORDS_PER_PART);
    for(let part=0;part<parts;part++)settings[`${key}::${address}:${part}`]=JSON.stringify(compactBlock(transactions.slice(part*CACHE_RECORDS_PER_PART,(part+1)*CACHE_RECORDS_PER_PART)));
    accounts[address]={...header,parts};
  }
  settings[key]=JSON.stringify({...data,accounts,storageVersion:1});return settings;
}
export function readBitcoinSettings(key:string,get:(key:string)=>string|null):BitcoinData{
  const value=JSON.parse(get(key)||'null');if(value?.storageVersion!==1)return bitcoinData(value);
  const accounts=Object.fromEntries(Object.entries(value.accounts).map(([address,row]:[string,any])=>{
    if(!Number.isSafeInteger(row.parts)||row.parts<0)throw new Error('Bitcoin cache is incomplete. Saved data is retained.');
    const transactions:unknown[]=[];
    for(let part=0;part<row.parts;part++){
      const raw=get(`${key}::${address}:${part}`);if(raw===null)throw new Error('Bitcoin cache is incomplete. Saved data is retained.');
      const rows=expandBlock(JSON.parse(raw));if(!Array.isArray(rows)||rows.length>CACHE_RECORDS_PER_PART)throw new Error('Bitcoin cache is incomplete. Saved data is retained.');
      for(const tx of rows)transactions.push(tx);
    }
    const {parts,...header}=row;return [address,{...header,transactions}];
  }));return bitcoinData({...value,accounts});
}
